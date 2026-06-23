import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

import { createServiceClient } from "../_shared/auth-tenant.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { syncTenantN8nEvolutionAutomation } from "../_shared/evolution-n8n-sync.ts";
import {
  findN8nWorkflowIdByWebhookRef,
  fetchN8nWorkflow,
  patchN8nWorkflowEvolutionSendText,
} from "../_shared/n8n-provision.ts";

const bodySchema = z.object({
  inspect: z.boolean().optional(),
  tenantId: z.number().int().positive().optional(),
  webhookRef: z.string().trim().min(8).optional(),
  workflowId: z.string().trim().min(4).optional(),
}).refine((value) => Boolean(value.workflowId || value.webhookRef), {
  message: "Informe workflowId ou webhookRef.",
});

const isServiceRoleRequest = (req: Request) => {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceKey) return false;
  const authHeader = req.headers.get("Authorization");
  return authHeader === `Bearer ${serviceKey}`;
};

const isAuthorizedRequest = (req: Request) => {
  if (isServiceRoleRequest(req)) return true;

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

    if (payload.tenantId) {
      const service = createServiceClient();
      const { data: tenant } = await service
        .from("tenants")
        .select("id")
        .eq("id", payload.tenantId)
        .maybeSingle();
      if (!tenant) {
        return jsonResponse({ ok: false, error: "Tenant não encontrado." }, 404);
      }
    }

    const workflowId =
      payload.workflowId ??
      (payload.webhookRef ? await findN8nWorkflowIdByWebhookRef(payload.webhookRef) : null);

    if (!workflowId) {
      return jsonResponse({ ok: false, error: "Workflow não encontrado para o webhook informado." }, 404);
    }

    if (payload.inspect) {
      const workflow = await fetchN8nWorkflow(workflowId);
      const evolutionNodes = (workflow.nodes ?? [])
        .filter((node) => (node.type ?? "").toLowerCase().includes("evolution"))
        .map((node) => ({
          credentials: node.credentials,
          name: node.name,
          parameters: node.parameters,
          type: node.type,
        }));
      const memoryNodes = (workflow.nodes ?? [])
        .filter((node) => (node.type ?? "").toLowerCase().includes("memorypostgreschat"))
        .map((node) => ({
          name: node.name,
          parameters: node.parameters,
          type: node.type,
        }));
      const webhookNodes = (workflow.nodes ?? [])
        .filter((node) => node.type === "n8n-nodes-base.webhook")
        .map((node) => ({
          name: node.name,
          parameters: node.parameters,
          type: node.type,
          webhookId: node.webhookId,
        }));

      return jsonResponse({
        ok: true,
        evolutionNodes,
        memoryNodes,
        webhookNodes,
        workflowId,
        workflowName: workflow.name ?? null,
      });
    }

    const { postgresCredential, workflow: updated } = await patchN8nWorkflowEvolutionSendText(workflowId);

    let automationSync: Awaited<ReturnType<typeof syncTenantN8nEvolutionAutomation>> | null = null;
    if (payload.tenantId) {
      const service = createServiceClient();
      const { data: tenant } = await service
        .from("tenants")
        .select("id, name, slug")
        .eq("id", payload.tenantId)
        .maybeSingle();

      if (tenant) {
        const { data: connection } = await service
          .from("whatsapp_connections")
          .select("id, instance_name, status")
          .eq("tenant_id", tenant.id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (connection) {
          automationSync = await syncTenantN8nEvolutionAutomation(service, tenant, connection);
        }
      }
    }

    return jsonResponse({
      ok: true,
      automationSync,
      postgresCredential,
      workflowId,
      workflowName: updated.name ?? null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonResponse({ ok: false, error: "Dados inválidos." }, 400);
    }

    const message = error instanceof Error ? error.message : "Erro inesperado.";
    return jsonResponse({ ok: false, error: message }, 500);
  }
});
