import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

import { findUserIdByEmail, generatePasswordRecoveryUrl } from "../_shared/auth-recovery-link.ts";
import { sendTransactionalEmail } from "../_shared/send-transactional-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const requestSchema = z.object({
  email: z.string().email(),
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

const normalizeEmail = (value: string) => value.trim().toLowerCase();

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

    const input = requestSchema.parse(await req.json());
    const email = normalizeEmail(input.email);

    const user = await findUserIdByEmail(supabase, email);

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      const { data: membership } = await supabase
        .from("tenant_members")
        .select("tenant_id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      const recipientName =
        profile?.full_name?.trim() ||
        String(user.user_metadata?.full_name ?? "").trim() ||
        "Cliente FestaAI";

      const resetPasswordUrl = await generatePasswordRecoveryUrl(supabase, email);

      await sendTransactionalEmail(supabaseUrl, serviceRoleKey, {
        metadata: {
          trigger: "password_reset_request",
          user_id: user.id,
        },
        params: {
          ctaLabel: "Redefinir minha senha",
          ctaUrl: resetPasswordUrl,
          name: recipientName,
          resetPasswordUrl,
        },
        recipient: {
          email,
          name: recipientName,
        },
        templateKey: "password_reset",
        tenantId: membership?.tenant_id ?? null,
      });
    }

    return jsonResponse({
      message: "Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.",
      success: true,
    });
  } catch (error) {
    console.error("request-password-reset error:", error);
    return jsonResponse({ error: "Nao foi possivel processar a solicitacao." }, 500);
  }
});
