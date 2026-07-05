import type { N8nWorkflowNode, N8nWorkflowResponse } from "./n8n-provision-types.ts";
import {
  attachPostgresCredentialToMemoryNodes,
  syncFestAiPostgresCredential,
} from "./n8n-postgres-credential-sync.ts";
import { findWebhookNodeName, patchTenantWorkflowNodes } from "./n8n-workflow-patch.ts";

type ServiceClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: number | string) => {
        maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: unknown }>;
      };
    };
    upsert: (
      values: Record<string, unknown>,
      options: { onConflict: string },
    ) => Promise<{ error: unknown }>;
  };
};

export type N8nProvisionStatus = "draft" | "active" | "error";

interface N8nWorkflowSummary {
  id: string;
  name?: string;
  parentFolder?: { id: string; name?: string } | null;
}

interface N8nFolderResponse {
  id?: string;
  items?: Array<{ id: string }>;
  name?: string;
  workflows?: Array<{ id: string }>;
}

export interface N8nClonedWorkflowRef {
  name: string;
  templateId: string;
  workflowId: string;
}

export interface ProvisionTenantN8nResult {
  clonedWorkflows: N8nClonedWorkflowRef[];
  disabled?: boolean;
  editorUrl: string | null;
  folderEditorUrl: string | null;
  folderId: string | null;
  provisionStatus: N8nProvisionStatus;
  skipped?: boolean;
  webhookUrl: string | null;
  workflowId: string | null;
}

/** Provisionamento de clones N8N desligado por padrão — habilite com N8N_WORKFLOW_PROVISIONING_ENABLED=true. */
export const isN8nWorkflowProvisioningEnabled = (): boolean =>
  Deno.env.get("N8N_WORKFLOW_PROVISIONING_ENABLED")?.trim().toLowerCase() === "true";

const EXECUTE_WORKFLOW_NODE_TYPES = new Set([
  "n8n-nodes-base.executeWorkflow",
  "@n8n/n8n-nodes-langchain.toolWorkflow",
]);

const ORCHESTRATOR_NAME_HINTS = ["orquestrador", "orchestrator"];

const getOrchestratorTemplateId = () =>
  Deno.env.get("N8N_ORCHESTRATOR_TEMPLATE_ID")?.trim() || "QoECZQ6Ri65bh8ZQ";

const requiredEnv = (key: string) => {
  const value = Deno.env.get(key);
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

const n8nApiFetch = async <T = unknown>(path: string, init?: RequestInit): Promise<T> => {
  const baseUrl = requiredEnv("N8N_API_URL").replace(/\/$/, "");
  const apiKey = requiredEnv("N8N_API_KEY");

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-N8N-API-KEY": apiKey,
      ...(init?.headers ?? {}),
    },
  });

  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text };
    }
  }

  if (!response.ok) {
    const message =
      typeof body === "object" && body && "message" in body
        ? String((body as { message: unknown }).message)
        : text || `N8N API error (${response.status})`;
    throw new Error(message);
  }

  return body as T;
};

const buildEditorUrl = (workflowId: string) => {
  const editorBase = Deno.env.get("N8N_EDITOR_BASE_URL")?.replace(/\/$/, "") ?? "https://editor.pratte.com.br";
  return `${editorBase}/workflow/${workflowId}`;
};

const buildProjectEditorUrl = (projectId: string) => {
  const editorBase = Deno.env.get("N8N_EDITOR_BASE_URL")?.replace(/\/$/, "") ?? "https://editor.pratte.com.br";
  return `${editorBase}/projects/${projectId}/workflows`;
};

const extractWebhookProductionUrl = (workflow: N8nWorkflowResponse): string | null => {
  const base = Deno.env.get("N8N_WEBHOOK_BASE_URL")?.replace(/\/$/, "");
  if (!base) return null;

  for (const node of workflow.nodes ?? []) {
    if (node.type !== "n8n-nodes-base.webhook") continue;

    const webhookId = node.webhookId;
    if (typeof webhookId === "string" && webhookId.length > 0) {
      return `${base}/webhook/${webhookId}`;
    }

    const path = node.parameters?.path;
    if (typeof path === "string" && path.length > 0) {
      return `${base}/webhook/${path}`;
    }
  }

  return null;
};

const ALLOWED_WORKFLOW_SETTINGS = new Set([
  "callerPolicy",
  "errorWorkflow",
  "executionOrder",
  "saveDataErrorExecution",
  "saveDataSuccessExecution",
  "saveManualExecutions",
  "timezone",
]);

const sanitizeSettings = (settings: Record<string, unknown> | undefined) => {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(settings ?? {})) {
    if (ALLOWED_WORKFLOW_SETTINGS.has(key)) {
      sanitized[key] = value;
    }
  }
  if (!sanitized.executionOrder) {
    sanitized.executionOrder = "v1";
  }
  return sanitized;
};

const sanitizeWorkflowForCreate = (source: N8nWorkflowResponse, name: string) => ({
  connections: source.connections ?? {},
  name: name.slice(0, 128),
  nodes: source.nodes ?? [],
  settings: sanitizeSettings(source.settings),
});

const listProjectWorkflows = async (projectId: string): Promise<N8nWorkflowSummary[]> => {
  const collected: N8nWorkflowSummary[] = [];
  let cursor: string | null = null;

  do {
    const query = new URLSearchParams({ limit: "250", projectId });
    if (cursor) query.set("cursor", cursor);

    const response = await n8nApiFetch<{ data?: N8nWorkflowSummary[]; nextCursor?: string | null }>(
      `/workflows?${query.toString()}`,
    );

    collected.push(...(response.data ?? []));
    cursor = response.nextCursor ?? null;
  } while (cursor);

  return collected;
};

const normalizeTemplateLabel = (templateName: string) =>
  templateName.replace(/^TEMPLATE\s+/i, "").trim();

const matchesTemplateName = (name: string) => {
  const prefix = (Deno.env.get("N8N_TEMPLATE_NAME_PREFIX") ?? "TEMPLATE").trim().toUpperCase();
  const normalized = name.trim().toUpperCase();
  return normalized.startsWith(prefix) && normalized.includes("FESTA AI");
};

const getTemplateWorkflowIdsFromEnv = (): Array<{ id: string; name: string }> => {
  const raw = Deno.env.get("N8N_TEMPLATE_WORKFLOW_IDS");
  if (!raw) return [];

  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((id) => ({ id, name: id }));
};

const getTemplateWorkflows = async (
  projectId: string,
  templateFolderId: string,
): Promise<Array<{ id: string; name: string }>> => {
  const explicitIds = getTemplateWorkflowIdsFromEnv();
  if (explicitIds.length > 0) {
    const resolved: Array<{ id: string; name: string }> = [];
    for (const item of explicitIds) {
      const workflow = await n8nApiFetch<N8nWorkflowResponse>(`/workflows/${item.id}`);
      resolved.push({ id: item.id, name: workflow.name ?? item.name });
    }
    return resolved;
  }

  try {
    const folder = await n8nApiFetch<N8nFolderResponse>(
      `/projects/${projectId}/folders/${templateFolderId}`,
    );

    const fromFolder = folder.workflows ?? folder.items ?? [];
    if (fromFolder.length > 0) {
      const summaries = await listProjectWorkflows(projectId);
      const nameById = new Map(summaries.map((item) => [item.id, item.name ?? item.id]));

      return fromFolder.map((item) => ({
        id: item.id,
        name: nameById.get(item.id) ?? item.id,
      }));
    }
  } catch {
    // fallback por prefixo de nome
  }

  const summaries = await listProjectWorkflows(projectId);
  const byFolder = summaries
    .filter((workflow) => workflow.parentFolder?.id === templateFolderId)
    .map((workflow) => ({ id: workflow.id, name: workflow.name ?? workflow.id }));

  if (byFolder.length > 0) {
    return byFolder;
  }

  return summaries
    .filter((workflow) => matchesTemplateName(workflow.name ?? ""))
    .map((workflow) => ({ id: workflow.id, name: workflow.name ?? workflow.id }));
};

const cloneWorkflow = async (source: N8nWorkflowResponse, name: string) => {
  const payload = sanitizeWorkflowForCreate(source, name);

  const created = await n8nApiFetch<N8nWorkflowResponse>("/workflows", {
    body: JSON.stringify(payload),
    method: "POST",
  });

  if (!created.id) {
    throw new Error(`N8N não retornou ID ao clonar workflow "${name}".`);
  }

  return created;
};

const remapWorkflowReferences = (nodes: N8nWorkflowNode[], idMap: Map<string, string>) => {
  return nodes.map((node) => {
    if (!node.type || !EXECUTE_WORKFLOW_NODE_TYPES.has(node.type)) {
      return node;
    }

    const parameters = { ...(node.parameters ?? {}) };
    let changed = false;

    const workflowId = parameters.workflowId;
    if (typeof workflowId === "string" && idMap.has(workflowId)) {
      parameters.workflowId = idMap.get(workflowId);
      changed = true;
    }

    const sourceWorkflowId = parameters.sourceWorkflowId;
    if (typeof sourceWorkflowId === "string" && idMap.has(sourceWorkflowId)) {
      parameters.sourceWorkflowId = idMap.get(sourceWorkflowId);
      changed = true;
    }

    return changed ? { ...node, parameters } : node;
  });
};

const findOrchestratorWorkflow = (
  clones: Array<{ created: N8nWorkflowResponse; templateName: string; templateId: string }>,
) => {
  const explicitName = Deno.env.get("N8N_ORCHESTRATOR_WORKFLOW_NAME")?.trim().toLowerCase();

  const orchestratorTemplateId = getOrchestratorTemplateId();

  const ranked = clones
    .map((item) => {
      const normalizedName = item.created.name?.toLowerCase() ?? item.templateName.toLowerCase();
      const hasWebhook = (item.created.nodes ?? []).some((node) => node.type === "n8n-nodes-base.webhook");
      const nameScore = explicitName
        ? normalizedName.includes(explicitName)
          ? 3
          : 0
        : ORCHESTRATOR_NAME_HINTS.some((hint) => normalizedName.includes(hint))
          ? 2
          : 0;
      const templateScore = item.templateId === orchestratorTemplateId ? 5 : 0;

      return { item, score: templateScore + nameScore + (hasWebhook ? 1 : 0) };
    })
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best || best.score === 0) {
    const withWebhook = clones.find((item) =>
      (item.created.nodes ?? []).some((node) => node.type === "n8n-nodes-base.webhook")
    );
    if (!withWebhook?.created.id) {
      throw new Error("Não foi possível identificar o workflow Orquestrador (webhook) entre os clones.");
    }
    return withWebhook;
  }

  return best.item;
};

/**
 * Clona os workflows template N8N do tenant, sem publicar (active: false).
 * inbound_automation_enabled permanece false até ativação manual no FestaAi.
 */
export const provisionTenantN8nWorkflow = async (
  service: ServiceClient,
  tenant: { id: number; name: string; slug: string },
): Promise<ProvisionTenantN8nResult> => {
  if (!isN8nWorkflowProvisioningEnabled()) {
    const { data: existing } = await service
      .from("tenant_automation_settings")
      .select("n8n_provision_status, n8n_workflow_id, n8n_workflows")
      .eq("tenant_id", tenant.id)
      .maybeSingle();

    const workflowId =
      typeof existing?.n8n_workflow_id === "string" ? existing.n8n_workflow_id : null;

    return {
      clonedWorkflows: Array.isArray(existing?.n8n_workflows)
        ? (existing.n8n_workflows as N8nClonedWorkflowRef[])
        : [],
      disabled: true,
      editorUrl: workflowId ? buildEditorUrl(workflowId) : null,
      folderEditorUrl: null,
      folderId: null,
      provisionStatus: (existing?.n8n_provision_status as N8nProvisionStatus) ?? "draft",
      skipped: true,
      webhookUrl: null,
      workflowId,
    };
  }

  const projectId = requiredEnv("N8N_PROJECT_ID");
  const templateFolderId = requiredEnv("N8N_TEMPLATE_FOLDER_ID");

  const { data: existing } = await service
    .from("tenant_automation_settings")
    .select("n8n_provision_status, n8n_workflow_id, n8n_workflows")
    .eq("tenant_id", tenant.id)
    .maybeSingle();

  if (existing?.n8n_workflow_id && existing.n8n_provision_status !== "error") {
    const workflowId = String(existing.n8n_workflow_id);

    return {
      clonedWorkflows: Array.isArray(existing.n8n_workflows) ? existing.n8n_workflows as N8nClonedWorkflowRef[] : [],
      editorUrl: buildEditorUrl(workflowId),
      folderEditorUrl: buildProjectEditorUrl(projectId),
      folderId: null,
      provisionStatus: (existing.n8n_provision_status as N8nProvisionStatus) ?? "draft",
      skipped: true,
      webhookUrl: null,
      workflowId,
    };
  }

  const templateWorkflows = await getTemplateWorkflows(projectId, templateFolderId);
  if (templateWorkflows.length === 0) {
    throw new Error(
      "Nenhum workflow template encontrado. Verifique a pasta Templates ou N8N_TEMPLATE_NAME_PREFIX.",
    );
  }

  const idMap = new Map<string, string>();
  const clones: Array<{ created: N8nWorkflowResponse; templateId: string; templateName: string }> = [];

  for (const template of templateWorkflows) {
    const source = await n8nApiFetch<N8nWorkflowResponse>(`/workflows/${template.id}`);
    const cloneName = `${tenant.name} - ${normalizeTemplateLabel(template.name)}`.slice(0, 128);
    const created = await cloneWorkflow(source, cloneName);

    if (!created.id) {
      throw new Error(`Falha ao clonar workflow template "${template.name}".`);
    }

    idMap.set(template.id, created.id);
    clones.push({ created, templateId: template.id, templateName: template.name });
  }

  const clonedWorkflows: N8nClonedWorkflowRef[] = [];

  for (const clone of clones) {
    if (!clone.created.id) continue;

    const remappedNodes = remapWorkflowReferences(clone.created.nodes ?? [], idMap);
    const webhookNodeName = findWebhookNodeName(remappedNodes);
    const postgresCredential = await syncFestAiPostgresCredential();
    let patchedNodes = patchTenantWorkflowNodes(remappedNodes, webhookNodeName);
    patchedNodes = attachPostgresCredentialToMemoryNodes(patchedNodes, postgresCredential);
    const updated = await n8nApiFetch<N8nWorkflowResponse>(`/workflows/${clone.created.id}`, {
      body: JSON.stringify({
        connections: clone.created.connections ?? {},
        name: clone.created.name ?? clone.templateName,
        nodes: patchedNodes,
        settings: sanitizeSettings(clone.created.settings),
      }),
      method: "PUT",
    });

    clone.created = updated;
    clonedWorkflows.push({
      name: updated.name ?? clone.templateName,
      templateId: clone.templateId,
      workflowId: clone.created.id,
    });
  }

  const orchestrator = findOrchestratorWorkflow(clones);
  const orchestratorId = orchestrator.created.id;
  if (!orchestratorId) {
    throw new Error("Orquestrador clonado sem ID.");
  }

  const webhookUrl = extractWebhookProductionUrl(orchestrator.created);
  const editorUrl = buildEditorUrl(orchestratorId);
  const projectEditorUrl = buildProjectEditorUrl(projectId);

  const { error: upsertError } = await service.from("tenant_automation_settings").upsert(
    {
      inbound_automation_enabled: false,
      n8n_editor_url: editorUrl,
      n8n_folder_id: null,
      n8n_inbound_webhook_url: webhookUrl,
      n8n_last_error: null,
      n8n_provision_status: "draft",
      n8n_provisioned_at: new Date().toISOString(),
      n8n_routing_key: tenant.slug,
      n8n_workflow_id: orchestratorId,
      n8n_workflows: clonedWorkflows,
      tenant_id: tenant.id,
    },
    { onConflict: "tenant_id" },
  );

  if (upsertError) throw upsertError;

  return {
    clonedWorkflows,
    editorUrl,
    folderEditorUrl: projectEditorUrl,
    folderId: null,
    provisionStatus: "draft",
    webhookUrl,
    workflowId: orchestratorId,
  };
};

export const fetchN8nWorkflow = async (workflowId: string): Promise<N8nWorkflowResponse> => {
  const workflow = await n8nApiFetch<N8nWorkflowResponse>(`/workflows/${workflowId}`);
  if (!workflow.id) {
    throw new Error(`Workflow "${workflowId}" não encontrado no N8N.`);
  }
  return workflow;
};

export const patchN8nWorkflowEvolutionSendText = async (
  workflowId: string,
  evolutionCredential?: { id: string; name: string },
): Promise<{ postgresCredential: { credentialId: string; credentialName: string }; workflow: N8nWorkflowResponse }> => {
  const workflow = await fetchN8nWorkflow(workflowId);
  const webhookNodeName = findWebhookNodeName(workflow.nodes ?? []);
  const postgresCredential = await syncFestAiPostgresCredential();
  let patchedNodes = patchTenantWorkflowNodes(workflow.nodes ?? [], webhookNodeName, evolutionCredential);
  patchedNodes = attachPostgresCredentialToMemoryNodes(patchedNodes, postgresCredential);

  // Remove campo number órfão de patches anteriores (Evolution node usa remoteJid).
  let cleanedNodes = patchedNodes.map((node) => {
    if (!isEvolutionSendTextNode(node)) return node;
    const parameters = { ...(node.parameters ?? {}) };
    if (parameters.number !== undefined && parameters.remoteJid !== undefined) {
      delete parameters.number;
    }
    return { ...node, parameters };
  });

  if (evolutionCredential) {
    cleanedNodes = cleanedNodes.map((node) => {
      if (!(node.type ?? "").toLowerCase().includes("evolution")) return node;
      return {
        ...node,
        credentials: {
          ...(node.credentials ?? {}),
          evolutionApi: {
            id: evolutionCredential.id,
            name: evolutionCredential.name,
          },
        },
      };
    });
  }

  return {
    postgresCredential,
    workflow: await n8nApiFetch<N8nWorkflowResponse>(`/workflows/${workflowId}`, {
      body: JSON.stringify({
        connections: workflow.connections ?? {},
        name: workflow.name,
        nodes: cleanedNodes,
        settings: sanitizeSettings(workflow.settings),
      }),
      method: "PUT",
    }),
  };
};

const isEvolutionSendTextNode = (node: N8nWorkflowNode) => {
  if (!(node.type ?? "").toLowerCase().includes("evolution")) return false;
  const parameters = node.parameters ?? {};
  return typeof parameters.messageText === "string";
};

export const findN8nWorkflowIdByWebhookRef = async (webhookRef: string): Promise<string | null> => {
  const projectId = requiredEnv("N8N_PROJECT_ID");
  const workflows = await listProjectWorkflows(projectId);

  for (const summary of workflows) {
    const workflow = await n8nApiFetch<N8nWorkflowResponse>(`/workflows/${summary.id}`);
    for (const node of workflow.nodes ?? []) {
      if (node.type !== "n8n-nodes-base.webhook") continue;

      const webhookId = node.webhookId;
      if (typeof webhookId === "string" && webhookId === webhookRef) {
        return summary.id;
      }

      const path = node.parameters?.path;
      if (typeof path === "string" && path === webhookRef) {
        return summary.id;
      }
    }
  }

  return null;
};
