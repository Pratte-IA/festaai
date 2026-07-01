import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

import { asaasRequest } from "../_shared/asaas-client.ts";
import { computeAnnualAdjustmentNoticeAt, computeNextAnnualAdjustmentAt } from "../_shared/annual-billing-adjustment.ts";
import { completeBillingFirstAccess } from "../_shared/billing-first-access.ts";
import { reactivateTenantAfterBillingPayment } from "../_shared/billing-tenant-access.ts";
import { provisionBillingTenant } from "../_shared/provision-billing-tenant.ts";

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const creditCardSchema = z.object({
  ccv: z.string().min(3).max(4),
  expiryMonth: z.string().min(1).max(2),
  expiryYear: z.string().min(2).max(4),
  holderName: z.string().min(2).max(120),
  number: z.string().min(13).max(19),
});

const paySchema = z.object({
  creditCard: creditCardSchema,
  externalReference: z.string().min(10).max(120),
  holderCpfCnpj: z.string().min(11).max(18).optional(),
  paymentKind: z.enum(["setup", "subscription"]),
});

type AsaasPaidPayment = {
  id: string;
  status?: string;
};

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

const normalizeDigits = (value: string) => value.replace(/\D/g, "");

const normalizeExpiryYear = (value: string) => {
  const digits = normalizeDigits(value);
  if (digits.length === 2) return `20${digits}`;
  return digits;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = requiredEnv("SUPABASE_URL");
    const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const input = paySchema.parse(await req.json());

    const { data: subscription, error } = await supabase
      .from("billing_subscriptions")
      .select(
        "id, tenant_id, metadata, billing_customers(name, email, phone, metadata)",
      )
      .eq("external_reference", input.externalReference)
      .maybeSingle();

    if (error) throw error;
    if (!subscription) {
      return jsonResponse({ error: "Checkout não encontrado." }, 404);
    }

    const metadata = (subscription.metadata ?? {}) as Record<string, unknown>;
    const paymentId =
      input.paymentKind === "setup"
        ? String(metadata.setup_provider_payment_id ?? "")
        : String(metadata.subscription_provider_payment_id ?? "");

    if (!paymentId) {
      return jsonResponse({ error: "Cobrança ainda não foi gerada." }, 404);
    }

    const customer = Array.isArray(subscription.billing_customers)
      ? subscription.billing_customers[0]
      : subscription.billing_customers;

    if (!customer?.email) {
      return jsonResponse({ error: "Dados do cliente incompletos." }, 400);
    }

    const customerMetadata = (customer.metadata ?? {}) as Record<string, unknown>;
    const cpfCnpj = normalizeDigits(
      input.holderCpfCnpj ?? String(customerMetadata.cpf_cnpj ?? ""),
    );

    if (cpfCnpj.length < 11) {
      return jsonResponse({ error: "CPF/CNPJ do titular é obrigatório." }, 400);
    }

    const payment = await asaasRequest<AsaasPaidPayment>(
      `/payments/${paymentId}/payWithCreditCard`,
      {
        body: JSON.stringify({
          creditCard: {
            ccv: input.creditCard.ccv,
            expiryMonth: normalizeDigits(input.creditCard.expiryMonth),
            expiryYear: normalizeExpiryYear(input.creditCard.expiryYear),
            holderName: input.creditCard.holderName,
            number: normalizeDigits(input.creditCard.number),
          },
          creditCardHolderInfo: {
            addressNumber: "100",
            cpfCnpj,
            email: customer.email,
            mobilePhone: normalizeDigits(customer.phone ?? "") || "41999999999",
            name: input.creditCard.holderName,
            phone: normalizeDigits(customer.phone ?? "") || "41999999999",
            postalCode: "80010000",
          },
        }),
        method: "POST",
      },
    );

    const isPaid = payment.status === "CONFIRMED" || payment.status === "RECEIVED";

    if (isPaid) {
      if (input.paymentKind === "setup") {
        await supabase
          .from("billing_subscriptions")
          .update({
            metadata: {
              ...metadata,
              checkout_phase: "setup_paid",
              setup_paid_at: new Date().toISOString(),
            },
            status: "pending",
          })
          .eq("id", subscription.id);

        await provisionBillingTenant(supabase, subscription.id);
        await completeBillingFirstAccess(supabase, supabaseUrl, serviceRoleKey, subscription.id);
      } else {
        const subscriptionPaidAt = new Date().toISOString();
        const monthlyPrice = Number(metadata.monthly_price ?? 0);
        await supabase
          .from("billing_subscriptions")
          .update({
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
          .eq("id", subscription.id);

        if (subscription.tenant_id) {
          await reactivateTenantAfterBillingPayment(supabase, subscription.tenant_id);
        }

        await completeBillingFirstAccess(supabase, supabaseUrl, serviceRoleKey, subscription.id);
      }
    }

    return jsonResponse({
      paymentId: payment.id,
      paymentKind: input.paymentKind,
      paymentStatus: payment.status ?? "PENDING",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro inesperado ao processar cartão.";
    return jsonResponse({ error: message }, 400);
  }
});
