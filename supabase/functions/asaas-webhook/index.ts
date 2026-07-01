import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

import { computeAnnualAdjustmentNoticeAt, computeNextAnnualAdjustmentAt } from "../_shared/annual-billing-adjustment.ts";
import { sendBoletoIssuedEmailIfNeeded } from "../_shared/billing-boleto-email.ts";
import { reactivateTenantAfterBillingPayment } from "../_shared/billing-tenant-access.ts";
import { completeBillingFirstAccess } from "../_shared/billing-first-access.ts";
import { provisionBillingTenant } from "../_shared/provision-billing-tenant.ts";
import {
  AsaasPayment,
  fetchPayment,
  isBoletoPayment,
  resolvePaymentCheckoutUrl,
} from "../_shared/asaas-client.ts";
import {
  loadBillingSubscriptionCustomer,
  syncBillingSubscriptionPayment,
} from "../_shared/sync-billing-payment.ts";

const corsHeaders = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, asaas-access-token, x-asaas-webhook-token",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface AsaasWebhookPayload {
  event?: string;
  id?: string;
  payment?: {
    bankSlipUrl?: string;
    billingType?: string;
    dueDate?: string;
    externalReference?: string;
    id?: string;
    invoiceUrl?: string;
    status?: string;
    subscription?: string;
    value?: number;
  };
  subscription?: {
    externalReference?: string;
    id?: string;
    status?: string;
  };
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });

const requiredEnv = (key: string) => {
  const value = Deno.env.get(key);
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const isPaymentSuccess = (eventType: string) =>
  eventType.includes("PAYMENT_RECEIVED") || eventType.includes("PAYMENT_CONFIRMED");

const isPaymentCreated = (eventType: string) => eventType.includes("PAYMENT_CREATED");

const mapSubscriptionStatus = (eventType: string, providerStatus?: string) => {
  if (eventType.includes("PAYMENT_OVERDUE")) return "past_due";
  if (eventType.includes("PAYMENT_DELETED") || eventType.includes("SUBSCRIPTION_DELETED")) {
    return "canceled";
  }
  if (providerStatus === "OVERDUE") return "past_due";
  if (providerStatus === "INACTIVE" || providerStatus === "CANCELED") return "canceled";
  return null;
};

const paymentFromPayload = (payload: AsaasWebhookPayload["payment"]): AsaasPayment | null => {
  if (!payload?.id) return null;

  return {
    bankSlipUrl: payload.bankSlipUrl ?? null,
    billingType: payload.billingType,
    dueDate: payload.dueDate ?? null,
    id: payload.id,
    invoiceUrl: payload.invoiceUrl ?? null,
    status: payload.status,
    value: payload.value ?? null,
  };
};

const resolveCheckoutUrlFromWebhook = async (payload: AsaasWebhookPayload["payment"]) => {
  const inlinePayment = paymentFromPayload(payload);
  if (inlinePayment?.bankSlipUrl || inlinePayment?.invoiceUrl) {
    return resolvePaymentCheckoutUrl(inlinePayment);
  }

  if (!payload?.id) return null;

  try {
    const payment = await fetchPayment(payload.id);
    return resolvePaymentCheckoutUrl(payment);
  } catch {
    return payload.invoiceUrl ?? payload.bankSlipUrl ?? null;
  }
};

const handleBoletoIssued = async (
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  serviceRoleKey: string,
  subscriptionId: number,
  payment: AsaasPayment,
  options: { chargeLabel: string; paymentKind: "setup" | "subscription" },
) => {
  if (!isBoletoPayment(payment)) return;
  if (payment.status && payment.status !== "PENDING" && payment.status !== "OVERDUE") return;

  const subscriptionData = await loadBillingSubscriptionCustomer(supabase, subscriptionId);
  if (!subscriptionData) return;

  await syncBillingSubscriptionPayment(
    supabase,
    subscriptionId,
    subscriptionData.metadata,
    { payment, paymentKind: options.paymentKind },
  );

  await sendBoletoIssuedEmailIfNeeded(
    supabase,
    supabaseUrl,
    serviceRoleKey,
    subscriptionData.customer,
    {
      chargeLabel: options.chargeLabel,
      dueDate: payment.dueDate,
      payment,
      subscriptionId,
      tenantId: subscriptionData.tenantId,
    },
  );
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const expectedToken = requiredEnv("ASAAS_WEBHOOK_TOKEN");
    const receivedToken =
      req.headers.get("asaas-access-token") ?? req.headers.get("x-asaas-webhook-token");

    if (receivedToken !== expectedToken) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const payload = (await req.json()) as AsaasWebhookPayload;
    const eventType = payload.event ?? "UNKNOWN";
    const externalEventId = payload.id ?? payload.payment?.id ?? crypto.randomUUID();
    const providerSubscriptionId = payload.subscription?.id ?? payload.payment?.subscription ?? null;
    const rawExternalReference =
      payload.payment?.externalReference ?? payload.subscription?.externalReference ?? null;
    const isSetupPayment = Boolean(rawExternalReference?.endsWith(":setup"));
    const externalReference = rawExternalReference?.replace(/:setup$/, "") ?? null;

    const supabaseUrl = requiredEnv("SUPABASE_URL");
    const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { error: eventError } = await supabase.from("billing_webhook_events").insert({
      event_type: eventType,
      external_event_id: externalEventId,
      payload,
      provider: "asaas",
    });

    if (eventError?.code === "23505") {
      return jsonResponse({ ok: true, duplicate: true });
    }

    if (eventError) throw eventError;

    if (providerSubscriptionId || externalReference) {
      let query = supabase
        .from("billing_subscriptions")
        .select("id, metadata, status, tenant_id")
        .limit(1);

      query = providerSubscriptionId && !isSetupPayment
        ? query.eq("provider", "asaas").eq("provider_subscription_id", providerSubscriptionId)
        : query.eq("external_reference", externalReference);

      const { data: billingSubscription, error: fetchError } = await query.maybeSingle();
      if (fetchError) throw fetchError;

      if (billingSubscription) {
        const metadata = (billingSubscription.metadata ?? {}) as Record<string, unknown>;
        const checkoutUrl = await resolveCheckoutUrlFromWebhook(payload.payment);
        const negativeStatus = mapSubscriptionStatus(
          eventType,
          payload.subscription?.status ?? payload.payment?.status,
        );

        if (isPaymentCreated(eventType) && payload.payment?.id) {
          const payment = await fetchPayment(payload.payment.id);
          const planName = String(metadata.plan_name ?? "FestaAI");
          await handleBoletoIssued(
            supabase,
            supabaseUrl,
            serviceRoleKey,
            billingSubscription.id,
            payment,
            {
              chargeLabel: isSetupPayment ? "implementação FestaAI" : `mensalidade FestaAI - Plano ${planName}`,
              paymentKind: isSetupPayment ? "setup" : "subscription",
            },
          );
        }

        if (negativeStatus) {
          const pastDueMetadata =
            negativeStatus === "past_due"
              ? { ...metadata, past_due_at: metadata.past_due_at ?? new Date().toISOString() }
              : metadata;

          const { error: updateError } = await supabase
            .from("billing_subscriptions")
            .update({
              checkout_url: checkoutUrl ?? undefined,
              metadata: pastDueMetadata,
              status: negativeStatus,
            })
            .eq("id", billingSubscription.id);

          if (updateError) throw updateError;
        } else if (isPaymentSuccess(eventType)) {
          if (isSetupPayment) {
            const { error: updateError } = await supabase
              .from("billing_subscriptions")
              .update({
                checkout_url: checkoutUrl ?? undefined,
                metadata: {
                  ...metadata,
                  checkout_phase: "setup_paid",
                  setup_paid_at: new Date().toISOString(),
                },
                status: "pending",
              })
              .eq("id", billingSubscription.id);

            if (updateError) throw updateError;

            await provisionBillingTenant(supabase, billingSubscription.id);
            await completeBillingFirstAccess(
              supabase,
              supabaseUrl,
              serviceRoleKey,
              billingSubscription.id,
            );
          } else {
            const subscriptionPaidAt = new Date().toISOString();
            const monthlyPrice = Number(metadata.monthly_price ?? 0);
            const { error: updateError } = await supabase
              .from("billing_subscriptions")
              .update({
                checkout_url: checkoutUrl ?? undefined,
                metadata: {
                  ...metadata,
                  checkout_phase: "completed",
                  contract_anniversary_at: subscriptionPaidAt,
                  current_monthly_price: monthlyPrice,
                  next_annual_adjustment_at: computeNextAnnualAdjustmentAt(subscriptionPaidAt),
                  next_annual_adjustment_notice_at: computeAnnualAdjustmentNoticeAt(
                    computeNextAnnualAdjustmentAt(subscriptionPaidAt),
                  ),
                  past_due_at: null,
                  subscription_paid_at: subscriptionPaidAt,
                },
                status: "active",
              })
              .eq("id", billingSubscription.id);

            if (updateError) throw updateError;

            if (billingSubscription.tenant_id) {
              await reactivateTenantAfterBillingPayment(supabase, billingSubscription.tenant_id);
            }

            await completeBillingFirstAccess(
              supabase,
              supabaseUrl,
              serviceRoleKey,
              billingSubscription.id,
            );
          }
        }
      }
    }

    await supabase
      .from("billing_webhook_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("provider", "asaas")
      .eq("external_event_id", externalEventId);

    return jsonResponse({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado no webhook.";
    return jsonResponse({ error: message }, 400);
  }
});
