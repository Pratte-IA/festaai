import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

import { createServiceClient } from "../_shared/auth-tenant.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { evolutionFetch, fetchInstanceApiKey } from "../_shared/evolution-client.ts";
import { n8nApiFetch } from "../_shared/n8n-api.ts";
import { syncTenantN8nEvolutionAutomation } from "../_shared/evolution-n8n-sync.ts";

const bodySchema = z.object({
  inspect: z.boolean().optional(),
  credentialId: z.string().trim().min(4).optional(),
  tenantId: z.number().int().positive(),
  connectionId: z.number().int().positive().optional(),
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

    if (payload.connectionId) {
      connectionQuery = connectionQuery.eq("id", payload.connectionId);
    }

    const { data: connections, error: connectionsError } = await connectionQuery;
    if (connectionsError) throw connectionsError;

    const target =
      connections?.find((item) => item.status === "connected") ??
      connections?.[0] ??
      null;

    if (!target) {
      return jsonResponse({ ok: false, error: "Nenhuma conexão WhatsApp encontrada." }, 404);
    }

    if (payload.inspect) {
      if (payload.credentialId) {
        const credential = await n8nApiFetch<Record<string, unknown>>(
          `/credentials/${payload.credentialId}?includeData=true`,
        );
        return jsonResponse({ ok: true, credential });
      }

      const fetchResult = await evolutionFetch(
        `/instance/fetchInstances?instanceName=${encodeURIComponent(target.instance_name)}`,
      );
      const resolvedKey = await fetchInstanceApiKey(target.instance_name);
      return jsonResponse({
        ok: true,
        connectionId: target.id,
        fetchStatus: fetchResult.status,
        fetchOk: fetchResult.ok,
        fetchBody: fetchResult.body,
        instanceName: target.instance_name,
        resolvedKeyPrefix: resolvedKey ? `${resolvedKey.slice(0, 8)}...` : null,
      });
    }

    const syncResult = await syncTenantN8nEvolutionAutomation(service, tenant, target);

    return jsonResponse({
      ok: true,
      connectionId: target.id,
      credential: syncResult.credential,
      instanceName: target.instance_name,
      patchedWorkflowIds: syncResult.patchedWorkflowIds,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonResponse({ ok: false, error: "Dados inválidos." }, 400);
    }

    const message = error instanceof Error ? error.message : "Erro inesperado.";
    return jsonResponse({ ok: false, error: message }, 500);
  }
});
