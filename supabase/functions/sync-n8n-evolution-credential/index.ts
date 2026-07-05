import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

import { createServiceClient } from "../_shared/auth-tenant.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { evolutionFetch, fetchInstanceApiKey } from "../_shared/evolution-client.ts";
import { n8nApiFetch } from "../_shared/n8n-api.ts";
import { syncAllTenantN8nEvolutionAutomations, resolvePreferredWhatsappConnectionForN8nSync } from "../_shared/evolution-n8n-sync.ts";

const bodySchema = z.object({
  connectionId: z.number().int().positive().optional(),
  credentialId: z.string().trim().min(4).optional(),
  inspect: z.boolean().optional(),
  templateKey: z.string().trim().min(2).optional(),
  tenantId: z.number().int().positive(),
});

const isAuthorizedRequest = (req: Request) => {
  const anonKey =
    Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("VITE_SUPABASE_ANON_KEY") ?? null;
  if (!anonKey) return false;
  const apiKey = req.headers.get("apikey");
  const authorization = req.headers.get("Authorization");
  return apiKey === anonKey || authorization === `Bearer ${anonKey}`;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }

  try {
    if (!isAuthorizedRequest(req)) {
      return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
    }

    const payload = bodySchema.parse(await req.json());
    const service = createServiceClient();

    const { data: tenant, error: tenantError } = await service
      .from("tenants")
      .select("id, name, slug")
      .eq("id", payload.tenantId)
      .maybeSingle();

    if (tenantError) throw tenantError;
    if (!tenant) {
      return jsonResponse({ ok: false, error: "Tenant não encontrado." }, 404);
    }

    let connectionQuery = service
      .from("whatsapp_connections")
      .select("id, instance_name, status")
      .eq("tenant_id", tenant.id)
      .order("updated_at", { ascending: false });

    const { data: connections, error: connectionsError } = await connectionQuery;
    if (connectionsError) throw connectionsError;

    const { data: automationSettings } = await service
      .from("tenant_automation_settings")
      .select("automation_template_bindings")
      .eq("tenant_id", tenant.id)
      .maybeSingle();

    const target = resolvePreferredWhatsappConnectionForN8nSync(
      connections ?? [],
      automationSettings?.automation_template_bindings,
      payload.connectionId,
    );

    if (!target) {
      return jsonResponse({ ok: false, error: "Nenhuma conexão WhatsApp encontrada." }, 404);
    }

    if (payload.inspect) {
      const inspectConnectionId = payload.connectionId ?? target.id;

      if (payload.credentialId) {
        const credential = await n8nApiFetch<Record<string, unknown>>(
          `/credentials/${payload.credentialId}?includeData=true`,
        );
        return jsonResponse({ ok: true, credential, connectionId: inspectConnectionId });
      }

      const inspectTarget =
        (connections ?? []).find((item) => item.id === inspectConnectionId) ?? target;

      const fetchResult = await evolutionFetch(
        `/instance/fetchInstances?instanceName=${encodeURIComponent(inspectTarget.instance_name)}`,
      );
      const resolvedKey = await fetchInstanceApiKey(inspectTarget.instance_name);
      return jsonResponse({
        ok: true,
        connectionId: inspectTarget.id,
        fetchStatus: fetchResult.status,
        fetchOk: fetchResult.ok,
        fetchBody: fetchResult.body,
        instanceName: inspectTarget.instance_name,
        resolvedKeyPrefix: resolvedKey ? `${resolvedKey.slice(0, 8)}...` : null,
      });
    }

    const syncResult = await syncAllTenantN8nEvolutionAutomations(service, tenant, {
      templateKey: payload.templateKey,
    });

    return jsonResponse({
      ok: true,
      results: syncResult.results,
      skipped: syncResult.skipped,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonResponse({ ok: false, error: "Dados inválidos." }, 400);
    }

    const message = error instanceof Error ? error.message : "Erro inesperado.";
    return jsonResponse({ ok: false, error: message }, 500);
  }
});
