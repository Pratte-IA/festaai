import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

import { resolveAuthedTenantMember } from "../_shared/auth-tenant.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  buildInstanceName,
  buildWebhookConfig,
  evolutionFetch,
  extractQrCode,
  generateWebhookToken,
  resolveInstanceApiKey,
  setEvolutionWebhook,
  tryFetchQrCode,
} from "../_shared/evolution-client.ts";
import {
  syncTenantN8nEvolutionAutomation,
} from "../_shared/evolution-n8n-sync.ts";
import { provisionTenantN8nWorkflow } from "../_shared/n8n-provision.ts";

const bodySchema = z.object({
  tenantId: z.number().int().positive(),
  name: z.string().trim().min(2).max(120),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }

  try {
    const payload = bodySchema.parse(await req.json());
    const auth = await resolveAuthedTenantMember(req, payload.tenantId, { requireAdmin: true });
    if (auth instanceof Response) return auth;

    const { service, tenantId, user } = auth;

    const { data: tenant, error: tenantError } = await service
      .from("tenants")
      .select("id, name, slug")
      .eq("id", tenantId)
      .maybeSingle();

    if (tenantError) throw tenantError;
    if (!tenant?.slug) {
      return jsonResponse({ ok: false, error: "Tenant não encontrado." }, 404);
    }

    const instanceName = buildInstanceName(tenant.slug);
    const webhookUrl = Deno.env.get("EVOLUTION_WEBHOOK_URL") ?? null;
    const globalWebhookToken = Deno.env.get("EVOLUTION_WEBHOOK_TOKEN") ?? null;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("VITE_SUPABASE_ANON_KEY") ?? null;
    const webhookToken = globalWebhookToken ?? generateWebhookToken();
    const integration = Deno.env.get("EVOLUTION_INSTANCE_INTEGRATION") ?? "WHATSAPP-BAILEYS";
    const webhookConfig = buildWebhookConfig(webhookUrl, webhookToken, anonKey);

    const instanceToken = crypto.randomUUID().replace(/-/g, "");

    const createResult = await evolutionFetch("/instance/create", {
      method: "POST",
      body: JSON.stringify({
        instanceName,
        integration,
        qrcode: true,
        token: instanceToken,
        webhook: webhookConfig ?? undefined,
      }),
    });

    if (!createResult.ok) {
      return jsonResponse(
        {
          ok: false,
          error: "Falha ao criar instância na Evolution.",
          provider_status: createResult.status,
          provider_response: createResult.body ?? createResult.raw,
        },
        502,
      );
    }

    if (webhookConfig) {
      try {
        await setEvolutionWebhook(instanceName, webhookConfig);
      } catch {
        // best-effort
      }
    }

    let qrCode =
      extractQrCode(createResult.body) ?? (await tryFetchQrCode(instanceName));

    const { data: connection, error: insertError } = await service
      .from("whatsapp_connections")
      .insert({
        created_by: user.id,
        instance_name: instanceName,
        name: payload.name,
        provider: "evolution",
        qr_code: qrCode,
        status: "connecting",
        tenant_id: tenantId,
        type: "whatsapp",
        webhook_url: webhookUrl,
      })
      .select("*")
      .single();

    if (insertError) throw insertError;

    const instanceApiKey =
      (await resolveInstanceApiKey(instanceName, createResult.body)) ?? instanceToken;

    const { error: secretError } = await service.from("whatsapp_connection_webhook_secrets").insert({
      connection_id: connection.id,
      instance_api_key: instanceApiKey,
      instance_name: instanceName,
      webhook_token: webhookToken,
    });

    if (secretError) throw secretError;

    try {
      await provisionTenantN8nWorkflow(service, {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      });
    } catch {
      // best-effort: admin pode reprovisionar manualmente
    }

    try {
      await syncTenantN8nEvolutionAutomation(service, tenant, connection, {
        createPayload: createResult.body,
        fallbackApiKey: instanceApiKey,
      });
    } catch {
      // best-effort — patch Enviar texto + credencial Evolution no n8n
    }

    if (webhookConfig) {
      try {
        await setEvolutionWebhook(instanceName, webhookConfig);
      } catch {
        // best-effort; regenerate/list também re-sincronizam
      }
    }

    if (!qrCode) {
      qrCode = await tryFetchQrCode(instanceName);
      if (qrCode) {
        await service.from("whatsapp_connections").update({ qr_code: qrCode }).eq("id", connection.id);
        connection.qr_code = qrCode;
      }
    }

    return jsonResponse({ ok: true, connection });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonResponse({ ok: false, error: "Dados inválidos." }, 400);
    }
    const message = error instanceof Error ? error.message : "Erro inesperado.";
    const isConfig = message.includes("EVOLUTION_API");
    return jsonResponse(
      { ok: false, error: isConfig ? "Integração Evolution não configurada no servidor." : message },
      500,
    );
  }
});
