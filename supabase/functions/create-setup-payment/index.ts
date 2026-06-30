import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const setupPaymentSchema = z.object({
  externalReference: z.string().min(10).max(120),
  setupInstallments: z.number().int().min(1).max(24),
});

type AsaasPayment = {
  bankSlipUrl?: string | null;
  id: string;
  invoiceUrl?: string | null;
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

const asaasRequest = async <T>(path: string, options: RequestInit = {}) => {
  const apiUrl = Deno.env.get("ASAAS_API_URL") ?? "https://sandbox.asaas.com/api/v3";
  const apiKey = requiredEnv("ASAAS_API_KEY");

  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      access_token: apiKey,
      ...(options.headers ?? {}),
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.errors?.[0]?.description ?? "Erro ao comunicar com o Asaas.";
    throw new Error(message);
  }

  return payload as T;
};

const resolvePaymentCheckoutUrl = (payment: AsaasPayment | null | undefined) =>
  payment?.invoiceUrl ?? payment?.bankSlipUrl ?? null;

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

    const input = setupPaymentSchema.parse(await req.json());

    const { data: subscription, error: subscriptionError } = await supabase
      .from("billing_subscriptions")
      .select("id, checkout_url, metadata, status")
      .eq("external_reference", input.externalReference)
      .maybeSingle();

    if (subscriptionError) throw subscriptionError;

    if (!subscription) {
      return jsonResponse({ error: "Checkout não encontrado." }, 404);
    }

    if (subscription.status === "active" || subscription.status === "trialing") {
      return jsonResponse({ error: "Esta contratação já foi paga." }, 409);
    }

    const metadata = (subscription.metadata ?? {}) as Record<string, unknown>;
    const setupPrice = Number(metadata.setup_price ?? 0);
    const maxSetupInstallments = Math.max(1, Number(metadata.max_setup_installments ?? 1));
    const asaasCustomerId = String(metadata.asaas_customer_id ?? "");
    const planName = String(metadata.plan_name ?? "FestaAI");

    if (setupPrice <= 0) {
      return jsonResponse({ error: "Este plano não possui cobrança de implementação." }, 400);
    }

    if (!asaasCustomerId) {
      return jsonResponse({ error: "Cliente Asaas não encontrado para este checkout." }, 400);
    }

    if (input.setupInstallments > maxSetupInstallments) {
      return jsonResponse(
        { error: `O parcelamento máximo permitido para este plano é ${maxSetupInstallments}x.` },
        400,
      );
    }

    const existingInstallments = metadata.setup_installments ? Number(metadata.setup_installments) : null;
    if (subscription.checkout_url && existingInstallments === input.setupInstallments) {
      return jsonResponse({
        checkoutUrl: subscription.checkout_url,
        setupInstallments: input.setupInstallments,
        setupInstallmentValue: setupPrice / input.setupInstallments,
        setupPrice,
      });
    }

    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 1);
    const nextDueDateISO = nextDueDate.toISOString().slice(0, 10);
    const setupExternalReference = `${input.externalReference}:setup`;
    const setupBillingType =
      input.setupInstallments > 1
        ? "CREDIT_CARD"
        : String(metadata.setup_billing_type ?? "UNDEFINED");

    const setupPaymentBody =
      input.setupInstallments <= 1
        ? {
            billingType: setupBillingType,
            customer: asaasCustomerId,
            description: `FestaAI - Implementação - Plano ${planName}`,
            dueDate: nextDueDateISO,
            externalReference: setupExternalReference,
            value: setupPrice,
          }
        : {
            billingType: setupBillingType,
            customer: asaasCustomerId,
            description: `FestaAI - Implementação - Plano ${planName} (${input.setupInstallments}x)`,
            dueDate: nextDueDateISO,
            externalReference: setupExternalReference,
            installmentCount: input.setupInstallments,
            totalValue: setupPrice,
          };

    const setupPayment = await asaasRequest<AsaasPayment>("/payments", {
      body: JSON.stringify(setupPaymentBody),
      method: "POST",
    });

    const checkoutUrl = resolvePaymentCheckoutUrl(setupPayment);

    const { error: updateError } = await supabase
      .from("billing_subscriptions")
      .update({
        checkout_url: checkoutUrl,
        metadata: {
          ...metadata,
          setup_external_reference: setupExternalReference,
          setup_installments: input.setupInstallments,
          setup_provider_payment_id: setupPayment.id,
        },
      })
      .eq("id", subscription.id);

    if (updateError) throw updateError;

    return jsonResponse({
      checkoutUrl,
      setupInstallments: input.setupInstallments,
      setupInstallmentValue: setupPrice / input.setupInstallments,
      setupPrice,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado ao gerar cobrança.";
    return jsonResponse({ error: message }, 400);
  }
});
