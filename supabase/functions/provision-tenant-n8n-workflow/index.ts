import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

import { resolveAuthedTenantMember } from "../_shared/auth-tenant.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { provisionTenantN8nWorkflow } from "../_shared/n8n-provision.ts";

const bodySchema = z.object({
  tenantId: z.number().int().positive(),
  unitId: z.number().int().positive().optional(),
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
      const result = await provisionTenantN8nWorkflow(service, tenant, payload.unitId);

      return jsonResponse({
        ok: true,
        clonedWorkflows: result.clonedWorkflows,
        disabled: result.disabled ?? false,
        editorUrl: result.editorUrl,
        folderEditorUrl: result.folderEditorUrl,
        folderId: result.folderId,
        message: result.disabled
          ? "Provisionamento automático de workflows N8N está desativado."
          : result.skipped
            ? "Workflows N8N já provisionados para este tenant."
            : "Templates clonados em rascunho. Personalize no N8N, publique manualmente e só então ative a automação no FestaAi.",
        provisionStatus: result.provisionStatus,
        skipped: result.skipped ?? false,
        webhookUrl: result.webhookUrl,
        workflowId: result.workflowId,
      });
    } catch (provisionError) {
      const message = provisionError instanceof Error ? provisionError.message : "Erro ao provisionar N8N.";
      let unitId = payload.unitId ?? null;
      if (unitId == null) {
        const matriz = await service
          .from("tenant_units")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("kind", "matriz")
          .maybeSingle();
        unitId = typeof matriz.data?.id === "number" ? matriz.data.id : null;
      }

      if (unitId != null) {
        await service.from("tenant_automation_settings").upsert(
          {
            inbound_automation_enabled: false,
            n8n_last_error: message,
            n8n_provision_status: "error",
            tenant_id: tenantId,
            unit_id: unitId,
          },
          { onConflict: "unit_id" },
        );
      }
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
