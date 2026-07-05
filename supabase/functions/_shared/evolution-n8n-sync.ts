import { parseAutomationBindings, resolveAutomationConnectionId } from "./automation-bindings.ts";
import { fetchInstanceApiKey, resolveInstanceApiKey } from "./evolution-client.ts";
import {
  buildConnectionEvolutionCredentialName,
  ensureConnectionEvolutionCredential,
} from "./n8n-credential-sync.ts";
import type { N8nWorkflowNode } from "./n8n-provision-types.ts";
import {
  findN8nWorkflowIdByWebhookRef,
  fetchN8nWorkflow,
  patchN8nWorkflowEvolutionSendText,
} from "./n8n-provision.ts";

const N8N_AUTOMATION_TEMPLATE_KEYS = ["atendimento", "boas-vindas", "sete-dias-antes"] as const;

type WhatsappConnectionRow = {
  id: number;
  instance_name: string;
  name: string;
  status: string;
};

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

export interface TenantN8nWorkflowAutomationTarget {
  connectionId: number | null;
  templateKey: string;
  webhookRef: string | null;
  workflowId: string | null;
}

export interface TenantN8nEvolutionWorkflowSyncResult {
  connectionId: number;
  credential: { credentialId: string; credentialName: string };
  instanceName: string;
  templateKey: string;
  workflowId: string;
}

export interface TenantN8nEvolutionFullSyncResult {
  results: TenantN8nEvolutionWorkflowSyncResult[];
  skipped: Array<{ reason: string; templateKey: string; workflowId?: string | null }>;
}

const extractWebhookRef = (url: unknown): string | null => {
  if (typeof url !== "string" || !url.trim()) return null;
  return url.split("/webhook/").pop()?.trim() || null;
};

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

export const resolveTenantWorkflowAutomationTargets = async (
  service: ServiceClient,
  tenantId: number,
): Promise<TenantN8nWorkflowAutomationTarget[]> => {
  const { data: settings } = await service
    .from("tenant_automation_settings")
    .select("automation_template_bindings, n8n_inbound_webhook_url, n8n_outbound_webhook_urls")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  const bindings = parseAutomationBindings(settings?.automation_template_bindings);
  const targets: TenantN8nWorkflowAutomationTarget[] = [];

  const inboundRef = extractWebhookRef(settings?.n8n_inbound_webhook_url);
  if (inboundRef) {
    targets.push({
      connectionId: resolveAutomationConnectionId(bindings, "atendimento"),
      templateKey: "atendimento",
      webhookRef: inboundRef,
      workflowId: await findN8nWorkflowIdByWebhookRef(inboundRef),
    });
  }

  const outboundUrls = settings?.n8n_outbound_webhook_urls;
  if (typeof outboundUrls === "object" && outboundUrls) {
    for (const templateKey of N8N_AUTOMATION_TEMPLATE_KEYS) {
      if (templateKey === "atendimento") continue;

      const url = (outboundUrls as Record<string, unknown>)[templateKey];
      const webhookRef = extractWebhookRef(url);
      if (!webhookRef) continue;

      targets.push({
        connectionId: resolveAutomationConnectionId(bindings, templateKey),
        templateKey,
        webhookRef,
        workflowId: await findN8nWorkflowIdByWebhookRef(webhookRef),
      });
    }
  }

  return targets;
};

const resolvePrimaryConnectionId = (
  connections: WhatsappConnectionRow[],
  rawBindings: unknown,
): number | null => {
  const atendimentoConnectionId = resolveAutomationConnectionId(rawBindings, "atendimento");
  if (atendimentoConnectionId != null) return atendimentoConnectionId;

  const connected = connections.find((item) => item.status === "connected");
  return connected?.id ?? connections[0]?.id ?? null;
};

/**
 * @deprecated Prefira syncAllTenantN8nEvolutionAutomations para tenants multi-número.
 */
export const resolvePreferredWhatsappConnectionForN8nSync = (
  connections: WhatsappConnectionRow[],
  rawBindings: unknown,
  explicitConnectionId?: number | null,
): WhatsappConnectionRow | null => {
  if (!connections.length) return null;

  if (explicitConnectionId != null) {
    return connections.find((item) => item.id === explicitConnectionId) ?? null;
  }

  const primaryId = resolvePrimaryConnectionId(connections, rawBindings);
  if (primaryId != null) {
    return connections.find((item) => item.id === primaryId) ?? null;
  }

  return connections.find((item) => item.status === "connected") ?? connections[0] ?? null;
};

export const resolveTenantN8nWorkflowIds = async (
  service: ServiceClient,
  tenantId: number,
): Promise<{ orchestratorId: string | null; workflowIds: string[] }> => {
  const targets = await resolveTenantWorkflowAutomationTargets(service, tenantId);
  const workflowIds = targets
    .map((target) => target.workflowId)
    .filter((workflowId): workflowId is string => Boolean(workflowId));

  return {
    orchestratorId: workflowIds[0] ?? null,
    workflowIds,
  };
};

export const syncTenantN8nWorkflowEvolutionAutomation = async (
  service: ServiceClient,
  tenant: { id: number; name: string; slug: string },
  target: TenantN8nWorkflowAutomationTarget,
  connections: WhatsappConnectionRow[],
  rawBindings: unknown,
  options?: {
    createPayload?: Record<string, unknown> | null;
    fallbackApiKey?: string | null;
  },
): Promise<TenantN8nEvolutionWorkflowSyncResult | null> => {
  if (!target.workflowId || target.connectionId == null) return null;

  const connection = connections.find((item) => item.id === target.connectionId);
  if (!connection) return null;

  const workflow = await fetchN8nWorkflow(target.workflowId);

  const instanceApiKey = await ensureConnectionInstanceApiKey(
    service,
    connection,
    options?.createPayload,
    options?.fallbackApiKey,
  );
  if (!instanceApiKey) return null;

  const primaryConnectionId = resolvePrimaryConnectionId(connections, rawBindings);
  const credential = await ensureConnectionEvolutionCredential(
    tenant,
    { name: connection.name },
    instanceApiKey,
    {
      isPrimary: connection.id === primaryConnectionId,
      workflowNodes: workflow.nodes ?? [],
    },
  );

  await patchN8nWorkflowEvolutionSendText(target.workflowId, credential);

  return {
    connectionId: connection.id,
    credential,
    instanceName: connection.instance_name,
    templateKey: target.templateKey,
    workflowId: target.workflowId,
  };
};

/**
 * Sincroniza cada workflow n8n com a credencial Evolution da conexão WhatsApp vinculada.
 */
export const syncAllTenantN8nEvolutionAutomations = async (
  service: ServiceClient,
  tenant: { id: number; name: string; slug: string },
  options?: {
    createPayload?: Record<string, unknown> | null;
    fallbackApiKey?: string | null;
    templateKey?: string;
  },
): Promise<TenantN8nEvolutionFullSyncResult> => {
  const [{ data: connections }, { data: automationSettings }, targets] = await Promise.all([
    service
      .from("whatsapp_connections")
      .select("id, instance_name, name, status")
      .eq("tenant_id", tenant.id)
      .order("updated_at", { ascending: false }),
    service
      .from("tenant_automation_settings")
      .select("automation_template_bindings")
      .eq("tenant_id", tenant.id)
      .maybeSingle(),
    resolveTenantWorkflowAutomationTargets(service, tenant.id),
  ]);

  const connectionRows = (connections ?? []) as WhatsappConnectionRow[];
  const rawBindings = automationSettings?.automation_template_bindings;
  const filteredTargets = options?.templateKey
    ? targets.filter((target) => target.templateKey === options.templateKey)
    : targets;

  const results: TenantN8nEvolutionWorkflowSyncResult[] = [];
  const skipped: TenantN8nEvolutionFullSyncResult["skipped"] = [];

  for (const target of filteredTargets) {
    if (!target.workflowId) {
      skipped.push({
        reason: "Workflow n8n não encontrado para o webhook configurado.",
        templateKey: target.templateKey,
        workflowId: null,
      });
      continue;
    }

    if (target.connectionId == null) {
      skipped.push({
        reason: "Automação sem conexão WhatsApp vinculada.",
        templateKey: target.templateKey,
        workflowId: target.workflowId,
      });
      continue;
    }

    try {
      const result = await syncTenantN8nWorkflowEvolutionAutomation(
        service,
        tenant,
        target,
        connectionRows,
        rawBindings,
        options,
      );

      if (!result) {
        skipped.push({
          reason: "Não foi possível resolver token Evolution da conexão vinculada.",
          templateKey: target.templateKey,
          workflowId: target.workflowId,
        });
        continue;
      }

      results.push(result);
    } catch (error) {
      skipped.push({
        reason: error instanceof Error ? error.message : "Erro ao sincronizar workflow.",
        templateKey: target.templateKey,
        workflowId: target.workflowId,
      });
    }
  }

  return { results, skipped };
};

/**
 * Sincroniza automação N8N do tenant após cadastro/conexão WhatsApp.
 * Com multi-número, atualiza todos os workflows n8n mapeados nas automações.
 */
export const syncTenantN8nEvolutionAutomation = async (
  service: ServiceClient,
  tenant: { id: number; name: string; slug: string },
  connection: { id: number; instance_name: string; name?: string },
  options?: {
    createPayload?: Record<string, unknown> | null;
    fallbackApiKey?: string | null;
  },
): Promise<TenantN8nEvolutionSyncResult> => {
  const fullSync = await syncAllTenantN8nEvolutionAutomations(service, tenant, options);

  const credential =
    fullSync.results.find((result) => result.connectionId === connection.id)?.credential ??
    fullSync.results[0]?.credential ??
    null;

  return {
    credential,
    patchedWorkflowIds: fullSync.results.map((result) => result.workflowId),
  };
};

export { buildConnectionEvolutionCredentialName };
