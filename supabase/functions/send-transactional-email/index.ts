import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

import { emailTemplateKeys, emailTemplates } from "../_shared/email-templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const emailSchema = z.object({
  metadata: z.record(z.unknown()).optional(),
  params: z.record(z.unknown()).optional(),
  recipient: z.object({
    email: z.string().email(),
    name: z.string().optional().nullable(),
  }),
  templateKey: z.enum(emailTemplateKeys),
  tenantId: z.number().int().positive().optional().nullable(),
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

const optionalEnv = (key: string) => Deno.env.get(key) ?? "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const supabase = createClient(requiredEnv("SUPABASE_URL"), requiredEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });

  const input = emailSchema.parse(await req.json());
  const template = emailTemplates[input.templateKey];
  const appBaseUrl = optionalEnv("APP_BASE_URL");
  const emailLogoUrl = optionalEnv("EMAIL_LOGO_URL");
  const params = {
    ...(input.params ?? {}),
    ...(appBaseUrl ? { appUrl: appBaseUrl } : {}),
    ...(emailLogoUrl ? { logoUrl: emailLogoUrl } : {}),
  };
  const subject = template.subject(params);
  const htmlContent = template.html(params);
  const textContent = template.text(params);

  const { data: event, error: insertError } = await supabase
    .from("email_events")
    .insert({
      metadata: input.metadata ?? {},
      payload: { params: input.params ?? {}, templateKey: input.templateKey },
      recipient_email: input.recipient.email,
      recipient_name: input.recipient.name ?? null,
      status: "queued",
      subject,
      template_key: input.templateKey,
      tenant_id: input.tenantId ?? null,
    })
    .select("id")
    .single();

  if (insertError) throw insertError;

  const brevoApiKey = optionalEnv("BREVO_API_KEY");
  const senderEmail = optionalEnv("BREVO_SENDER_EMAIL");

  if (!brevoApiKey || !senderEmail) {
    await supabase
      .from("email_events")
      .update({
        error_message: "Brevo nao configurado.",
        status: "skipped",
      })
      .eq("id", event.id);

    return jsonResponse({ emailEventId: event.id, skipped: true });
  }

  const senderName = optionalEnv("BREVO_SENDER_NAME") || "FestaAI";
  const replyToEmail = optionalEnv("BREVO_REPLY_TO_EMAIL") || senderEmail;

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    body: JSON.stringify({
      htmlContent,
      replyTo: { email: replyToEmail, name: senderName },
      sender: { email: senderEmail, name: senderName },
      subject,
      textContent,
      to: [{ email: input.recipient.email, name: input.recipient.name ?? undefined }],
    }),
    headers: {
      accept: "application/json",
      "api-key": brevoApiKey,
      "content-type": "application/json",
    },
    method: "POST",
  });

  const brevoPayload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = brevoPayload?.message ?? "Falha ao enviar e-mail pela Brevo.";
    await supabase
      .from("email_events")
      .update({
        error_message: message,
        metadata: { brevoPayload },
        status: "failed",
      })
      .eq("id", event.id);

    return jsonResponse({ emailEventId: event.id, error: message }, 502);
  }

  const providerMessageId = brevoPayload?.messageId ?? brevoPayload?.messageIds?.[0] ?? null;
  await supabase
    .from("email_events")
    .update({
      metadata: { brevoPayload },
      provider_message_id: providerMessageId,
      sent_at: new Date().toISOString(),
      status: "sent",
    })
    .eq("id", event.id);

  return jsonResponse({ emailEventId: event.id, providerMessageId });
});
