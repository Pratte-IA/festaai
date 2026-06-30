import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

import {
  fetchPayment,
  fetchPaymentIdentificationField,
  fetchPaymentPixQrCode,
  resolvePaymentCheckoutUrl,
} from "../_shared/asaas-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const detailsSchema = z.object({
  externalReference: z.string().min(10).max(120),
  paymentKind: z.enum(["setup", "subscription"]),
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

const isPixEligible = (billingType?: string) =>
  !billingType || billingType === "PIX" || billingType === "UNDEFINED";

const isBoletoEligible = (billingType?: string) =>
  !billingType || billingType === "BOLETO" || billingType === "UNDEFINED";

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

    const input = detailsSchema.parse(await req.json());

    const { data: subscription, error } = await supabase
      .from("billing_subscriptions")
      .select("metadata, provider_subscription_id")
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

    const payment = await fetchPayment(paymentId);
    const billingType = payment.billingType ?? "UNDEFINED";

    let pixQrCode: { encodedImage?: string; expirationDate?: string; payload?: string } | null = null;
    let boleto: { barCode?: string; identificationField?: string } | null = null;

    if (isPixEligible(billingType)) {
      try {
        pixQrCode = await fetchPaymentPixQrCode(paymentId);
      } catch {
        pixQrCode = null;
      }
    }

    if (isBoletoEligible(billingType)) {
      try {
        boleto = await fetchPaymentIdentificationField(paymentId);
      } catch {
        boleto = null;
      }
    }

    return jsonResponse({
      billingType,
      boleto,
      invoiceUrl: resolvePaymentCheckoutUrl(payment),
      paymentId,
      paymentKind: input.paymentKind,
      paymentStatus: payment.status ?? "PENDING",
      pixQrCode,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado ao consultar cobrança.";
    return jsonResponse({ error: message }, 400);
  }
});
