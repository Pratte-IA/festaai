import { fetchInstanceApiKey, resolveInstanceApiKey } from "./evolution-client.ts";
import type { N8nWorkflowNode } from "./n8n-provision-types.ts";
import {
  findN8nWorkflowIdByWebhookRef,
  fetchN8nWorkflow,
  patchN8nWorkflowEvolutionSendText,
} from "./n8n-provision.ts";
import { syncTenantEvolutionCredential } from "./n8n-credential-sync.ts";

type ServiceClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: number | string) => {
        maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: unknown }>;
        order: (column: string, options: { ascending: boolean }) => {
          limit: (count: number) => {
            maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: unknown }>;
          };
        };
      };
    };
    update: (values: Record<string, unknown>) => {
      eq: (column: string, value: number | string) => Promise<{ error: unknown }>;
    };
  };
};

export interface TenantN8nEvolutionSyncResult {
  credential: { credentialId: string; credentialName: string } | null;
  patchedWorkflowIds: string[];
}

export const persistConnectionInstanceApiKey = async (
  service: ServiceClient,
  connectionId: number,
  instanceName: string,
  instanceApiKey: string,
) => {
  const { error } = await service
    .from("whatsapp_connection_webhook_secrets")
    .update({
      instance_api_key: instanceApiKey,
      instance_name: instanceName,
    })
    .eq("connection_id", connectionId);

  if (error) throw error;
};

export const ensureConnectionInstanceApiKey = async (
  service: ServiceClient,
  connection: { id: number; instance_name: string },
  createPayload?: Record<string, unknown> | null,
  fallbackApiKey?: string | null,
): Promise<string | null> => {
  const { data: secretRow } = await service
    .from("whatsapp_connection_webhook_secrets")
    .select("instance_api_key")
    .eq("connection_id", connection.id)
    .maybeSingle();

  const stored =
    typeof secretRow?.instance_api_key === "string" && secretRow.instance_api_key.trim()
      ? secretRow.instance_api_key.trim()
      : null;

  if (stored) return stored;

  const resolved =
    (await resolveInstanceApiKey(connection.instance_name, createPayload ?? null)) ??
    (fallbackApiKey?.trim() ? fallbackApiKey.trim() : null) ??
    (await fetchInstanceApiKey(connection.instance_name));

  if (!resolved) return null;

  await persistConnectionInstanceApiKey(service, connection.id, connection.instance_name, resolved);
  return resolved;
};

export const resolveTenantN8nWorkflowIds = async (
  service: ServiceClient,
  tenantId: number,
): Promise<{ orchestratorId: string | null; workflowIds: string[] }> => {
  const { data: settings } = await service
    .from("tenant_automation_settings")
    .select("n8n_workflow_id, n8n_inbound_webhook_url, n8n_workflows")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  const orchestratorId =
    typeof settings?.n8n_workflow_id === "string" ? settings.n8n_workflow_id : null;

  const workflowIds = new Set<string>();
  if (orchestratorId) workflowIds.add(orchestratorId);

  if (Array.isArray(settings?.n8n_workflows)) {
    for (const entry of settings.n8n_workflows) {
      if (typeof entry !== "object" || !entry) continue;
      const workflowId = (entry as { workflowId?: unknown }).workflowId;
      if (typeof workflowId === "string" && workflowId.trim()) {
        workflowIds.add(workflowId);
      }
    }
  }

  if (workflowIds.size === 0 && typeof settings?.n8n_inbound_webhook_url === "string") {
    const webhookRef = settings.n8n_inbound_webhook_url.split("/webhook/").pop()?.trim();
    if (webhookRef) {
      const resolved = await findN8nWorkflowIdByWebhookRef(webhookRef);
      if (resolved) workflowIds.add(resolved);
    }
  }

  return {
    orchestratorId: orchestratorId ?? [...workflowIds][0] ?? null,
    workflowIds: [...workflowIds],
  };
};

export const syncConnectionEvolutionCredentialToN8n = async (
  service: ServiceClient,
  tenant: { id: number; name: string; slug: string },
  connection: { id: number; instance_name: string },
  createPayload?: Record<string, unknown> | null,
  options?: { fallbackApiKey?: string | null; workflowId?: string | null },
): Promise<{ credentialId: string; credentialName: string } | null> => {
  const instanceApiKey = await ensureConnectionInstanceApiKey(
    service,
    connection,
    createPayload,
    options?.fallbackApiKey,
  );

  if (!instanceApiKey) return null;

  let workflowNodes: N8nWorkflowNode[] | undefined;
  if (options?.workflowId) {
    try {
      const workflow = await fetchN8nWorkflow(options.workflowId);
      workflowNodes = workflow.nodes ?? [];
    } catch {
      workflowNodes = undefined;
    }
  }

  return await syncTenantEvolutionCredential(tenant, instanceApiKey, workflowNodes);
};

/**
 * Sincroniza automação N8N do tenant após cadastro/conexão WhatsApp:
 * - patch dos nodes "Enviar texto" (instanceName via Webhook)
 * - apikey da instância na credencial Evolution do tenant
 */
export const syncTenantN8nEvolutionAutomation = async (
  service: ServiceClient,
  tenant: { id: number; name: string; slug: string },
  connection: { id: number; instance_name: string },
  options?: {
    createPayload?: Record<string, unknown> | null;
    fallbackApiKey?: string | null;
  },
): Promise<TenantN8nEvolutionSyncResult> => {
  const { orchestratorId, workflowIds } = await resolveTenantN8nWorkflowIds(service, tenant.id);

  const patchedWorkflowIds: string[] = [];
  for (const workflowId of workflowIds) {
    try {
      await patchN8nWorkflowEvolutionSendText(workflowId);
      patchedWorkflowIds.push(workflowId);
    } catch {
      // best-effort por workflow
    }
  }

  const credential = await syncConnectionEvolutionCredentialToN8n(
    service,
    tenant,
    connection,
    options?.createPayload,
    {
      fallbackApiKey: options?.fallbackApiKey,
      workflowId: orchestratorId,
    },
  );

  return { credential, patchedWorkflowIds };
};
