import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const statusSchema = z.object({
  externalReference: z.string().min(10).max(120),
});

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

const resolveCheckoutPhase = (metadata: Record<string, unknown>, status: string) => {
  const phase = String(metadata.checkout_phase ?? "");
  if (phase) return phase;
  if (status === "active" || status === "trialing") return "completed";
  return "setup_pending";
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

    const input = statusSchema.parse(await req.json());

    const { data, error } = await supabase
      .from("billing_subscriptions")
      .select(
        "status, checkout_url, external_reference, metadata, tenant_id, provider, subscription_plans(name, monthly_price, setup_price)",
      )
      .eq("external_reference", input.externalReference)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return jsonResponse({ error: "Checkout não encontrado." }, 404);
    }

    const metadata = (data.metadata ?? {}) as Record<string, unknown>;
    const plan = data.subscription_plans as {
      name?: string;
      monthly_price?: number;
      setup_price?: number;
    } | null;

    const checkoutPhase = resolveCheckoutPhase(metadata, data.status);
    const billingChannel = String(metadata.billing_channel ?? data.provider ?? "asaas") === "manual"
      ? "manual"
      : "asaas";

    return jsonResponse({
      billingChannel,
      checkoutPhase,
      checkoutUrl: data.checkout_url,
      externalReference: data.external_reference,
      maxSetupInstallments: Number(metadata.max_setup_installments ?? 1) || 1,
      monthlyPrice: Number(metadata.monthly_price ?? plan?.monthly_price ?? 0) || null,
      planName: String(metadata.plan_name ?? plan?.name ?? "") || null,
      selectedSetupInstallments: metadata.setup_installments ? Number(metadata.setup_installments) : null,
      setupInstallmentValue:
        metadata.setup_installments && metadata.setup_price
          ? Number(metadata.setup_price) / Number(metadata.setup_installments)
          : null,
      setupPaymentMethods: String(metadata.setup_payment_methods ?? "") || null,
      setupPaymentId: metadata.setup_provider_payment_id
        ? String(metadata.setup_provider_payment_id)
        : null,
      setupPrice: Number(metadata.setup_price ?? plan?.setup_price ?? 0) || null,
      status: data.status,
      subscriptionCommitmentTotal: metadata.subscription_commitment_total
        ? Number(metadata.subscription_commitment_total)
        : null,
      subscriptionMaxPayments: metadata.subscription_max_payments
        ? Number(metadata.subscription_max_payments)
        : null,
      subscriptionPaymentId: metadata.subscription_provider_payment_id
        ? String(metadata.subscription_provider_payment_id)
        : null,
      subscriptionPaymentMethods: String(metadata.subscription_payment_methods ?? "") || null,
      tenantId: data.tenant_id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado ao consultar checkout.";
    return jsonResponse({ error: message }, 400);
  }
});
