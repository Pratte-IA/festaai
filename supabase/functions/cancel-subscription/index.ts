import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const schema = z.object({
  subscriptionId: z.number().int().positive(),
});

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

const cancelAsaasSubscription = async (providerSubscriptionId: string) => {
  const apiKey = Deno.env.get("ASAAS_API_KEY");
  if (!apiKey) return;

  const apiUrl = Deno.env.get("ASAAS_API_URL") ?? "https://sandbox.asaas.com/api/v3";
  const response = await fetch(`${apiUrl}/subscriptions/${providerSubscriptionId}`, {
    headers: { access_token: apiKey },
    method: "DELETE",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.errors?.[0]?.description ?? "Nao foi possivel cancelar no Asaas.");
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization) return jsonResponse({ error: "Unauthorized" }, 401);

    const supabaseUrl = requiredEnv("SUPABASE_URL");
    const anonKey = requiredEnv("SUPABASE_ANON_KEY");
    const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const userClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authorization } },
    });
    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const input = schema.parse(await req.json());
    const { data: subscription, error } = await userClient
      .from("billing_subscriptions")
      .select("id, provider, provider_subscription_id")
      .eq("id", input.subscriptionId)
      .single();

    if (error) throw error;
    if (!subscription) return jsonResponse({ error: "Assinatura nao encontrada." }, 404);

    if (subscription.provider === "asaas" && subscription.provider_subscription_id) {
      await cancelAsaasSubscription(subscription.provider_subscription_id);
    }

    const { error: updateError } = await serviceClient
      .from("billing_subscriptions")
      .update({ canceled_at: new Date().toISOString(), status: "canceled" })
      .eq("id", subscription.id);

    if (updateError) throw updateError;

    return jsonResponse({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado ao cancelar assinatura.";
    return jsonResponse({ error: message }, 400);
  }
});
