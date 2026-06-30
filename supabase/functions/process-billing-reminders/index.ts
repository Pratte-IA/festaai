import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

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

const hoursBetween = (from: string, to = new Date()) =>
  (to.getTime() - new Date(from).getTime()) / (1000 * 60 * 60);

const formatDueDate = (value: string) => {
  const date = new Date(`${value}T12:00:00`);
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
};

const tomorrowISO = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
};

const isBoletoBilling = (metadata: Record<string, unknown>) => {
  const setupType = String(metadata.setup_billing_type ?? "").toUpperCase();
  const subscriptionType = String(metadata.subscription_billing_type ?? "").toUpperCase();
  return setupType === "BOLETO" || subscriptionType === "BOLETO";
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
    const cronSecret = optionalEnv("BILLING_REMINDERS_CRON_SECRET");
    if (cronSecret) {
      const received = req.headers.get("x-cron-secret");
      if (received !== cronSecret) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }
    }

    const supabaseUrl = requiredEnv("SUPABASE_URL");
    const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const sent: string[] = [];
    const dueTomorrow = tomorrowISO();

    const { data: subscriptions, error } = await supabase
      .from("billing_subscriptions")
      .select(
        "id, tenant_id, status, next_due_date, checkout_url, metadata, billing_customers(email, name)",
      )
      .in("status", ["pending", "active", "past_due"]);

    if (error) throw error;

    for (const subscription of subscriptions ?? []) {
      const metadata = (subscription.metadata ?? {}) as Record<string, unknown>;
      const customer = Array.isArray(subscription.billing_customers)
        ? subscription.billing_customers[0]
        : subscription.billing_customers;

      if (!customer?.email) continue;

      const basePayload = {
        email: customer.email,
        name: customer.name,
        tenantId: subscription.tenant_id,
        subscriptionId: subscription.id,
        checkoutUrl: subscription.checkout_url,
      };

      if (
        subscription.next_due_date === dueTomorrow &&
        isBoletoBilling(metadata) &&
        subscription.status !== "past_due"
      ) {
        const templateKey: EmailTemplateKey = "billing_boleto_due_reminder";
        if (!(await wasEmailAlreadySent(supabase, templateKey, subscription.id))) {
          await sendTransactionalEmail(supabaseUrl, serviceRoleKey, {
            metadata: { billing_subscription_id: subscription.id, trigger: "boleto_due_reminder" },
            params: {
              checkoutUrl: basePayload.checkoutUrl,
              dueDate: formatDueDate(subscription.next_due_date),
              name: basePayload.name,
            },
            recipient: { email: basePayload.email, name: basePayload.name },
            templateKey,
            tenantId: basePayload.tenantId,
          });
          sent.push(`${templateKey}:${subscription.id}`);
        }
      }

      if (subscription.status !== "past_due") continue;

      const pastDueAt = String(metadata.past_due_at ?? "");
      if (!pastDueAt) continue;

      const overdueHours = hoursBetween(pastDueAt);
      let templateKey: EmailTemplateKey | null = null;

      if (overdueHours >= 49) {
        templateKey = "billing_overdue_blocked";
      } else if (overdueHours >= 36) {
        templateKey = "billing_overdue_36h";
      } else if (overdueHours >= 24) {
        templateKey = "billing_overdue_24h";
      }

      if (!templateKey) continue;
      if (await wasEmailAlreadySent(supabase, templateKey, subscription.id)) {
        continue;
      }

      await sendTransactionalEmail(supabaseUrl, serviceRoleKey, {
        metadata: { billing_subscription_id: subscription.id, overdue_hours: Math.floor(overdueHours), trigger: "overdue_reminder" },
        params: {
          checkoutUrl: basePayload.checkoutUrl,
          name: basePayload.name,
        },
        recipient: { email: basePayload.email, name: basePayload.name },
        templateKey,
        tenantId: basePayload.tenantId,
      });
      sent.push(`${templateKey}:${subscription.id}`);
    }

    return jsonResponse({ ok: true, sentCount: sent.length, sent });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado ao processar lembretes.";
    return jsonResponse({ error: message }, 400);
  }
});
