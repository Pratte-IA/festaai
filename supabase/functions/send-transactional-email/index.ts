import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const templateKeys = [
  "welcome",
  "invite_member",
  "billing_checkout_started",
  "billing_payment_confirmed",
  "billing_payment_overdue",
] as const;

const emailSchema = z.object({
  metadata: z.record(z.unknown()).optional(),
  params: z.record(z.unknown()).optional(),
  recipient: z.object({
    email: z.string().email(),
    name: z.string().optional().nullable(),
  }),
  templateKey: z.enum(templateKeys),
  tenantId: z.number().int().positive().optional().nullable(),
});

type TemplateKey = (typeof templateKeys)[number];

interface EmailTemplate {
  subject: (params: Record<string, unknown>) => string;
  html: (params: Record<string, unknown>) => string;
  text: (params: Record<string, unknown>) => string;
}

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const param = (params: Record<string, unknown>, key: string, fallback: string) =>
  String(params[key] ?? fallback);

const templates: Record<TemplateKey, EmailTemplate> = {
  welcome: {
    subject: () => "Bem-vindo ao FestaAI",
    html: (params) => `
      <h1>Bem-vindo ao FestaAI</h1>
      <p>Ola, ${escapeHtml(param(params, "name", "tudo bem"))}.</p>
      <p>Sua central de controle para casas de festas infantis esta pronta para organizar vendas, calendario e operacao.</p>
    `,
    text: (params) =>
      `Ola, ${param(params, "name", "tudo bem")}. Sua central de controle FestaAI esta pronta.`,
  },
  invite_member: {
    subject: (params) => `Convite para acessar ${param(params, "tenantName", "FestaAI")}`,
    html: (params) => `
      <h1>Voce foi convidado para o FestaAI</h1>
      <p>${escapeHtml(param(params, "inviterName", "Um administrador"))} convidou voce para acessar ${escapeHtml(param(params, "tenantName", "uma empresa"))}.</p>
      <p>Acesse o FestaAI e entre com este e-mail para continuar.</p>
    `,
    text: (params) =>
      `${param(params, "inviterName", "Um administrador")} convidou voce para acessar ${param(params, "tenantName", "uma empresa")} no FestaAI.`,
  },
  billing_checkout_started: {
    subject: (params) => `Contratacao iniciada - Plano ${param(params, "planName", "FestaAI")}`,
    html: (params) => `
      <h1>Contratacao iniciada</h1>
      <p>Recebemos sua solicitacao para o plano ${escapeHtml(param(params, "planName", "FestaAI"))}.</p>
      <p>Se ainda nao concluiu o pagamento, use o link seguro enviado pelo Asaas.</p>
    `,
    text: (params) =>
      `Recebemos sua solicitacao para o plano ${param(params, "planName", "FestaAI")}. Conclua o pagamento pelo link seguro do Asaas.`,
  },
  billing_payment_confirmed: {
    subject: () => "Pagamento confirmado - FestaAI",
    html: () => `
      <h1>Pagamento confirmado</h1>
      <p>Seu pagamento foi confirmado e sua assinatura FestaAI esta ativa.</p>
    `,
    text: () => "Seu pagamento foi confirmado e sua assinatura FestaAI esta ativa.",
  },
  billing_payment_overdue: {
    subject: () => "Pagamento em atraso - FestaAI",
    html: () => `
      <h1>Pagamento em atraso</h1>
      <p>Identificamos um pagamento em atraso na sua assinatura FestaAI.</p>
      <p>Regularize pelo link de cobranca para manter o acesso ativo.</p>
    `,
    text: () => "Identificamos um pagamento em atraso na sua assinatura FestaAI.",
  },
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
  const template = templates[input.templateKey];
  const params = input.params ?? {};
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
