import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

import { provisionBillingTenant } from "../_shared/provision-billing-tenant.ts";
import { sendTransactionalEmail } from "../_shared/send-transactional-email.ts";

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
    id?: string;
    externalReference?: string;
    invoiceUrl?: string;
    status?: string;
    subscription?: string;
  };
  subscription?: {
    id?: string;
    externalReference?: string;
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

const mapSubscriptionStatus = (eventType: string, providerStatus?: string) => {
  if (eventType.includes("PAYMENT_OVERDUE")) return "past_due";
  if (eventType.includes("PAYMENT_DELETED") || eventType.includes("SUBSCRIPTION_DELETED")) {
    return "canceled";
  }
  if (providerStatus === "OVERDUE") return "past_due";
  if (providerStatus === "INACTIVE" || providerStatus === "CANCELED") return "canceled";
  return null;
};

const emailTemplateForStatus = (status: string) => {
  if (status === "active") return "billing_payment_confirmed";
  return null;
};

const sendBillingStatusEmail = async (
  supabaseUrl: string,
  serviceRoleKey: string,
  subscriptionId: string | null,
  externalReference: string | null,
  status: string,
) => {
  const templateKey = emailTemplateForStatus(status);
  if (!templateKey) return;

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  let query = supabase
    .from("billing_subscriptions")
    .select("tenant_id, billing_customers(email, name), subscription_plans(name)")
    .limit(1)
    .maybeSingle();

  query = subscriptionId
    ? query.eq("provider", "asaas").eq("provider_subscription_id", subscriptionId)
    : query.eq("external_reference", externalReference);

  const { data } = await query;
  const customer = Array.isArray(data?.billing_customers)
    ? data?.billing_customers[0]
    : data?.billing_customers;
  const plan = Array.isArray(data?.subscription_plans)
    ? data?.subscription_plans[0]
    : data?.subscription_plans;

  if (!customer?.email) return;

  await sendTransactionalEmail(supabaseUrl, serviceRoleKey, {
    params: {
      name: customer.name,
      planName: plan?.name ?? "FestaAI",
    },
    recipient: {
      email: customer.email,
      name: customer.name,
    },
    templateKey,
    tenantId: data?.tenant_id ?? null,
  });
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
        const negativeStatus = mapSubscriptionStatus(
          eventType,
          payload.subscription?.status ?? payload.payment?.status,
        );

        if (negativeStatus) {
          const pastDueMetadata =
            negativeStatus === "past_due"
              ? { ...metadata, past_due_at: metadata.past_due_at ?? new Date().toISOString() }
              : metadata;

          const { error: updateError } = await supabase
            .from("billing_subscriptions")
            .update({
              checkout_url: payload.payment?.invoiceUrl ?? undefined,
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
                checkout_url: payload.payment?.invoiceUrl ?? undefined,
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
          } else {
            const { error: updateError } = await supabase
              .from("billing_subscriptions")
              .update({
                checkout_url: payload.payment?.invoiceUrl ?? undefined,
                metadata: {
                  ...metadata,
                  checkout_phase: "completed",
                  past_due_at: null,
                  subscription_paid_at: new Date().toISOString(),
                },
                status: "active",
              })
              .eq("id", billingSubscription.id);

            if (updateError) throw updateError;

            await sendBillingStatusEmail(
              supabaseUrl,
              serviceRoleKey,
              providerSubscriptionId,
              externalReference,
              "active",
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
