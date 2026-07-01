import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

import {
  AsaasSubscription,
  asaasRequest,
  fetchSubscriptionPayments,
  isBoletoPayment,
  resolvePaymentCheckoutUrl,
} from "../_shared/asaas-client.ts";
import { sendBoletoIssuedEmailIfNeeded } from "../_shared/billing-boleto-email.ts";
import { loadBillingSubscriptionCustomer } from "../_shared/sync-billing-payment.ts";

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const activateSchema = z.object({
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

const resolvePendingPayment = async (subscriptionId: string) => {
  const payments = await fetchSubscriptionPayments(subscriptionId);
  const pending = payments.data?.find(
    (payment) => payment.status === "PENDING" || payment.status === "OVERDUE",
  );
  return pending ?? payments.data?.[0] ?? null;
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

    const input = activateSchema.parse(await req.json());

    const { data: subscription, error } = await supabase
      .from("billing_subscriptions")
      .select("id, external_reference, metadata, provider_subscription_id, status")
      .eq("external_reference", input.externalReference)
      .maybeSingle();

    if (error) throw error;
    if (!subscription) {
      return jsonResponse({ error: "Checkout não encontrado." }, 404);
    }

    const metadata = (subscription.metadata ?? {}) as Record<string, unknown>;
    const checkoutPhase = String(metadata.checkout_phase ?? "setup_pending");

    if (checkoutPhase === "setup_pending") {
      return jsonResponse({ error: "Conclua o pagamento da implementação antes de continuar." }, 409);
    }

    if (checkoutPhase === "completed" || subscription.status === "active") {
      return jsonResponse({
        checkoutPhase: "completed",
        paymentId: metadata.subscription_provider_payment_id
          ? String(metadata.subscription_provider_payment_id)
          : null,
        subscriptionPaymentId: metadata.subscription_provider_payment_id
          ? String(metadata.subscription_provider_payment_id)
          : null,
      });
    }

    const asaasCustomerId = String(metadata.asaas_customer_id ?? "");
    const planName = String(metadata.plan_name ?? "FestaAI");
    const monthlyPrice = Number(metadata.monthly_price ?? 0);
    const subscriptionMaxPayments = metadata.subscription_max_payments
      ? Number(metadata.subscription_max_payments)
      : null;
    const subscriptionBillingType = String(metadata.subscription_billing_type ?? "UNDEFINED");
    const firstDueDate = String(
      metadata.subscription_first_due_date ?? new Date().toISOString().slice(0, 10),
    );

    if (!asaasCustomerId || monthlyPrice <= 0) {
      return jsonResponse({ error: "Dados da assinatura incompletos." }, 400);
    }

    let providerSubscriptionId = subscription.provider_subscription_id;
    let pendingPayment = null;

    if (providerSubscriptionId) {
      pendingPayment = await resolvePendingPayment(providerSubscriptionId);
    } else {
      const asaasSubscription = await asaasRequest<AsaasSubscription>("/subscriptions", {
        body: JSON.stringify({
          billingType: subscriptionBillingType,
          customer: asaasCustomerId,
          cycle: "MONTHLY",
          description: subscriptionMaxPayments
            ? `FestaAI - Mensalidade - Plano ${planName} (${subscriptionMaxPayments}x de R$ ${monthlyPrice})`
            : `FestaAI - Mensalidade - Plano ${planName}`,
          externalReference: subscription.external_reference,
          nextDueDate: firstDueDate,
          value: monthlyPrice,
          ...(subscriptionMaxPayments ? { maxPayments: subscriptionMaxPayments } : {}),
        }),
        method: "POST",
      });

      providerSubscriptionId = asaasSubscription.id;
      pendingPayment = await resolvePendingPayment(providerSubscriptionId);
    }

    const checkoutUrl = resolvePaymentCheckoutUrl(pendingPayment);
    const subscriptionPaymentId = pendingPayment?.id ?? null;

    const { error: updateError } = await supabase
      .from("billing_subscriptions")
      .update({
        checkout_url: checkoutUrl,
        ...(pendingPayment?.dueDate ? { next_due_date: pendingPayment.dueDate } : {}),
        metadata: {
          ...metadata,
          checkout_phase: "subscription_pending",
          subscription_provider_payment_id: subscriptionPaymentId,
        },
        provider_subscription_id: providerSubscriptionId,
      })
      .eq("id", subscription.id);

    if (updateError) throw updateError;

    if (pendingPayment && isBoletoPayment(pendingPayment)) {
      const subscriptionData = await loadBillingSubscriptionCustomer(supabase, subscription.id);
      if (subscriptionData) {
        await sendBoletoIssuedEmailIfNeeded(
          supabase,
          supabaseUrl,
          serviceRoleKey,
          subscriptionData.customer,
          {
            chargeLabel: `mensalidade FestaAI - Plano ${planName}`,
            dueDate: pendingPayment.dueDate,
            payment: pendingPayment,
            subscriptionId: subscription.id,
            tenantId: subscriptionData.tenantId,
          },
        );
      }
    }

    return jsonResponse({
      checkoutPhase: "subscription_pending",
      checkoutUrl,
      paymentId: subscriptionPaymentId,
      subscriptionPaymentId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro inesperado ao iniciar checkout da mensalidade.";
    return jsonResponse({ error: message }, 400);
  }
});
