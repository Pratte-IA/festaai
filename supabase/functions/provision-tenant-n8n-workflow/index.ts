import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

import { resolveAuthedTenantMember } from "../_shared/auth-tenant.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { provisionTenantN8nWorkflow } from "../_shared/n8n-provision.ts";

const bodySchema = z.object({
  tenantId: z.number().int().positive(),
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

    const { service, tenantId } = auth;

    const { data: tenant, error: tenantError } = await service
      .from("tenants")
      .select("id, name, slug")
      .eq("id", tenantId)
      .maybeSingle();

    if (tenantError) throw tenantError;
    if (!tenant) {
      return jsonResponse({ ok: false, error: "Tenant não encontrado." }, 404);
    }

    try {
      const result = await provisionTenantN8nWorkflow(service, tenant);

      return jsonResponse({
        ok: true,
        clonedWorkflows: result.clonedWorkflows,
        editorUrl: result.editorUrl,
        folderEditorUrl: result.folderEditorUrl,
        folderId: result.folderId,
        message: result.skipped
          ? "Pasta N8N já provisionada para este tenant."
          : "Pasta Templates clonada em rascunho. Personalize no N8N, publique manualmente e só então ative a automação no FestaAi.",
        provisionStatus: result.provisionStatus,
        skipped: result.skipped ?? false,
        webhookUrl: result.webhookUrl,
        workflowId: result.workflowId,
      });
    } catch (provisionError) {
      const message = provisionError instanceof Error ? provisionError.message : "Erro ao provisionar N8N.";
      await service.from("tenant_automation_settings").upsert(
        {
          inbound_automation_enabled: false,
          n8n_last_error: message,
          n8n_provision_status: "error",
          tenant_id: tenantId,
        },
        { onConflict: "tenant_id" },
      );
      throw provisionError;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonResponse({ ok: false, error: "Dados inválidos." }, 400);
    }

    const message = error instanceof Error ? error.message : "Erro inesperado.";
    return jsonResponse({ ok: false, error: message }, 500);
  }
});
