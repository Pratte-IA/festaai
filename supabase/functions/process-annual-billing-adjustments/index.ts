import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

import {
  ANNUAL_ADJUSTMENT_INDEX,
  ANNUAL_ADJUSTMENT_NOTICE_DAYS,
  applyAnnualAdjustmentRate,
  buildAnnualAdjustmentNoticeParams,
  computeAnnualAdjustmentNoticeAt,
  computeNextAnnualAdjustmentAt,
  resolveAnnualAdjustmentRate,
  updateAsaasSubscriptionValue,
} from "../_shared/annual-billing-adjustment.ts";
import type { EmailTemplateKey } from "../_shared/email-templates.ts";
import { sendTransactionalEmail } from "../_shared/send-transactional-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });

const requiredEnv = (key: string) => {
  const value = Deno.env.get(key);
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

const optionalEnv = (key: string) => Deno.env.get(key) ?? "";

type SubscriptionRow = {
  billing_customers: {
    company_name: string | null;
    email: string;
    name: string;
  } | Array<{
    company_name: string | null;
    email: string;
    name: string;
  }> | null;
  id: number;
  metadata: Record<string, unknown> | null;
  provider_subscription_id: string | null;
  status: string;
  tenant_id: number | null;
};

const resolveCustomer = (row: SubscriptionRow) => {
  const customer = Array.isArray(row.billing_customers)
    ? row.billing_customers[0]
    : row.billing_customers;
  return customer ?? null;
};

const wasEmailAlreadySent = async (
  supabase: ReturnType<typeof createClient>,
  templateKey: EmailTemplateKey,
  subscriptionId: number,
) => {
  const { count } = await supabase
    .from("email_events")
    .select("id", { count: "exact", head: true })
    .eq("template_key", templateKey)
    .eq("status", "sent")
    .contains("metadata", { billing_subscription_id: subscriptionId });

  return (count ?? 0) > 0;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const cronSecret = optionalEnv("BILLING_ANNUAL_ADJUSTMENT_CRON_SECRET");
    if (cronSecret) {
      const received = req.headers.get("x-cron-secret");
      if (received !== cronSecret) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }
    }

    const supabaseUrl = requiredEnv("SUPABASE_URL");
    const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const appUrl = optionalEnv("APP_URL") || "https://festaai.com.br";
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const nowISO = new Date().toISOString();
    const adjustmentRate = await resolveAnnualAdjustmentRate();

    const { data: subscriptions, error } = await supabase
      .from("billing_subscriptions")
      .select(
        `
        id,
        provider_subscription_id,
        status,
        tenant_id,
        metadata,
        billing_customers ( name, email, company_name )
      `,
      )
      .eq("status", "active")
      .not("provider_subscription_id", "is", null);

    if (error) throw error;

    let noticesSent = 0;
    let processed = 0;
    let adjusted = 0;
    const errors: string[] = [];

    for (const row of (subscriptions ?? []) as SubscriptionRow[]) {
      const metadata = (row.metadata ?? {}) as Record<string, unknown>;
      if (metadata.annual_adjustment_disabled === true) continue;

      const currentMonthlyPrice = Number(
        metadata.current_monthly_price ?? metadata.monthly_price ?? 0,
      );
      if (currentMonthlyPrice <= 0) continue;

      const nextAdjustmentAt = String(metadata.next_annual_adjustment_at ?? "");
      const noticeAt = String(
        metadata.next_annual_adjustment_notice_at ??
          (nextAdjustmentAt ? computeAnnualAdjustmentNoticeAt(nextAdjustmentAt) : ""),
      );
      const customer = resolveCustomer(row);
      const projectedPrice = applyAnnualAdjustmentRate(currentMonthlyPrice, adjustmentRate);
      const effectiveDateLabel = nextAdjustmentAt
        ? new Date(nextAdjustmentAt).toLocaleDateString("pt-BR")
        : "—";

      const noticeParams = buildAnnualAdjustmentNoticeParams({
        appUrl,
        companyName: customer?.company_name ?? "sua casa de festas",
        effectiveDate: effectiveDateLabel,
        indexLabel: ANNUAL_ADJUSTMENT_INDEX,
        name: customer?.name ?? customer?.email ?? "Cliente",
        newMonthlyPrice: projectedPrice,
        noticeDaysAhead: ANNUAL_ADJUSTMENT_NOTICE_DAYS,
        previousMonthlyPrice: currentMonthlyPrice,
        ratePercent: adjustmentRate,
      });

      const shouldSendNotice =
        noticeAt &&
        noticeAt <= nowISO &&
        !metadata.annual_adjustment_notice_sent_at &&
        nextAdjustmentAt > nowISO &&
        customer?.email;

      if (shouldSendNotice) {
        const alreadySent = await wasEmailAlreadySent(
          supabase,
          "billing_annual_adjustment_notice",
          row.id,
        );

        if (!alreadySent) {
          await sendTransactionalEmail(supabaseUrl, serviceRoleKey, {
            metadata: {
              billing_subscription_id: row.id,
              template_key: "billing_annual_adjustment_notice",
            },
            params: noticeParams,
            recipient: { email: customer.email, name: customer.name ?? customer.email },
            templateKey: "billing_annual_adjustment_notice",
            tenantId: row.tenant_id,
          }).catch(() => null);
        }

        await supabase
          .from("billing_subscriptions")
          .update({
            metadata: {
              ...metadata,
              annual_adjustment_notice_sent_at: nowISO,
              projected_annual_adjustment_rate: adjustmentRate,
            },
          })
          .eq("id", row.id);

        noticesSent += 1;
      }

      if (!nextAdjustmentAt || nextAdjustmentAt > nowISO) continue;

      processed += 1;

      const newMonthlyPrice = projectedPrice;
      if (newMonthlyPrice <= currentMonthlyPrice) {
        const nextAnnual = computeNextAnnualAdjustmentAt(nowISO);
        await supabase
          .from("billing_subscriptions")
          .update({
            metadata: {
              ...metadata,
              annual_adjustment_notice_sent_at: null,
              last_annual_adjustment_at: nowISO,
              last_annual_adjustment_rate: adjustmentRate,
              next_annual_adjustment_at: nextAnnual,
              next_annual_adjustment_notice_at: computeAnnualAdjustmentNoticeAt(nextAnnual),
            },
          })
          .eq("id", row.id);
        continue;
      }

      const providerSubscriptionId = String(row.provider_subscription_id);
      const planName = String(metadata.plan_name ?? "FestaAI");

      try {
        await updateAsaasSubscriptionValue(
          providerSubscriptionId,
          newMonthlyPrice,
          `FestaAI - Mensalidade - Plano ${planName} (reajuste IPCA)`,
        );
      } catch (asaasError) {
        errors.push(
          `subscription ${row.id}: ${asaasError instanceof Error ? asaasError.message : "erro Asaas"}`,
        );
        continue;
      }

      const nextAnnualAdjustmentAt = computeNextAnnualAdjustmentAt(nowISO);

      const { error: adjustmentError } = await supabase.from("billing_subscription_adjustments").insert({
        adjustment_index: ANNUAL_ADJUSTMENT_INDEX,
        adjustment_rate: adjustmentRate,
        asaas_updated: true,
        billing_subscription_id: row.id,
        metadata: { next_annual_adjustment_at: nextAnnualAdjustmentAt },
        new_monthly_price: newMonthlyPrice,
        previous_monthly_price: currentMonthlyPrice,
        provider_subscription_id: providerSubscriptionId,
      });

      if (adjustmentError) {
        errors.push(`subscription ${row.id}: ${adjustmentError.message}`);
        continue;
      }

      await supabase
        .from("billing_subscriptions")
        .update({
          metadata: {
            ...metadata,
            annual_adjustment_notice_sent_at: null,
            current_monthly_price: newMonthlyPrice,
            last_annual_adjustment_at: nowISO,
            last_annual_adjustment_rate: adjustmentRate,
            monthly_price: newMonthlyPrice,
            next_annual_adjustment_at: nextAnnualAdjustmentAt,
            next_annual_adjustment_notice_at: computeAnnualAdjustmentNoticeAt(nextAnnualAdjustmentAt),
            projected_annual_adjustment_rate: null,
          },
        })
        .eq("id", row.id);

      adjusted += 1;

      if (customer?.email) {
        const alreadySent = await wasEmailAlreadySent(
          supabase,
          "billing_annual_adjustment",
          row.id,
        );

        if (!alreadySent) {
          await sendTransactionalEmail(supabaseUrl, serviceRoleKey, {
            metadata: {
              billing_subscription_id: row.id,
              template_key: "billing_annual_adjustment",
            },
            params: {
              ...noticeParams,
              effectiveDate: new Date(nowISO).toLocaleDateString("pt-BR"),
              newMonthlyPrice: newMonthlyPrice.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              }),
            },
            recipient: { email: customer.email, name: customer.name ?? customer.email },
            templateKey: "billing_annual_adjustment",
            tenantId: row.tenant_id,
          }).catch(() => null);
        }

        await supabase
          .from("billing_subscription_adjustments")
          .update({ notified_at: new Date().toISOString() })
          .eq("billing_subscription_id", row.id)
          .eq("new_monthly_price", newMonthlyPrice)
          .is("notified_at", null);
      }
    }

    return jsonResponse({
      adjusted,
      adjustmentRate,
      adjustmentRatePercent: (adjustmentRate * 100).toFixed(2),
      errors,
      index: ANNUAL_ADJUSTMENT_INDEX,
      noticesSent,
      ok: true,
      processed,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro inesperado ao processar reajustes anuais.";
    return jsonResponse({ error: message }, 400);
  }
});
