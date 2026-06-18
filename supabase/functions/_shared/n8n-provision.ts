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

interface N8nWorkflowNode {
  id?: string;
  name?: string;
  parameters?: Record<string, unknown>;
  type?: string;
  webhookId?: string;
}

interface N8nWorkflowSummary {
  id: string;
  name?: string;
  parentFolder?: { id: string; name?: string } | null;
}

interface N8nWorkflowResponse {
  active?: boolean;
  connections?: Record<string, unknown>;
  id?: string;
  name?: string;
  nodes?: N8nWorkflowNode[];
  parentFolder?: { id: string; name?: string } | null;
  settings?: Record<string, unknown>;
  staticData?: unknown;
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
  editorUrl: string | null;
  folderEditorUrl: string | null;
  folderId: string | null;
  provisionStatus: N8nProvisionStatus;
  skipped?: boolean;
  webhookUrl: string | null;
  workflowId: string | null;
}

const EXECUTE_WORKFLOW_NODE_TYPES = new Set([
  "n8n-nodes-base.executeWorkflow",
  "@n8n/n8n-nodes-langchain.toolWorkflow",
]);

const ORCHESTRATOR_NAME_HINTS = ["orquestrador", "orchestrator"];

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

const buildFolderEditorUrl = (projectId: string, folderId: string) => {
  const editorBase = Deno.env.get("N8N_EDITOR_BASE_URL")?.replace(/\/$/, "") ?? "https://editor.pratte.com.br";
  return `${editorBase}/projects/${projectId}/folders/${folderId}/workflows`;
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

const buildProjectEditorUrl = (projectId: string) => {
  const editorBase = Deno.env.get("N8N_EDITOR_BASE_URL")?.replace(/\/$/, "") ?? "https://editor.pratte.com.br";
  return `${editorBase}/projects/${projectId}/workflows`;
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
    // N8N 2.7.x pode não expor API de pastas — fallback por prefixo de nome.
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

const createTenantFolder = async (projectId: string, folderName: string): Promise<string | null> => {
  try {
    const created = await n8nApiFetch<N8nFolderResponse>(`/projects/${projectId}/folders`, {
      body: JSON.stringify({ name: folderName.slice(0, 128) }),
      method: "POST",
    });

    return created.id ?? null;
  } catch {
    return null;
  }
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

      return { item, score: nameScore + (hasWebhook ? 1 : 0) };
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
 * Clona a pasta Templates N8N inteira para o tenant, sem publicar (active: false).
 * inbound_automation_enabled permanece false até ativação manual no FestaAi.
 */
export const provisionTenantN8nWorkflow = async (
  service: ServiceClient,
  tenant: { id: number; name: string; slug: string },
): Promise<ProvisionTenantN8nResult> => {
  const projectId = requiredEnv("N8N_PROJECT_ID");
  const templateFolderId = requiredEnv("N8N_TEMPLATE_FOLDER_ID");

  const { data: existing } = await service
    .from("tenant_automation_settings")
    .select("n8n_folder_id, n8n_provision_status, n8n_workflow_id, n8n_workflows")
    .eq("tenant_id", tenant.id)
    .maybeSingle();

  if (existing?.n8n_workflow_id && existing.n8n_provision_status !== "error") {
    const folderId = existing.n8n_folder_id ? String(existing.n8n_folder_id) : null;
    const workflowId = String(existing.n8n_workflow_id);

    return {
      clonedWorkflows: Array.isArray(existing.n8n_workflows) ? existing.n8n_workflows as N8nClonedWorkflowRef[] : [],
      editorUrl: buildEditorUrl(workflowId),
      folderEditorUrl: folderId ? buildFolderEditorUrl(projectId, folderId) : buildProjectEditorUrl(projectId),
      folderId,
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

  const folderName = `${tenant.name} - FESTAAI`;
  const tenantFolderId = await createTenantFolder(projectId, folderName);

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
    const updated = await n8nApiFetch<N8nWorkflowResponse>(`/workflows/${clone.created.id}`, {
      body: JSON.stringify({
        connections: clone.created.connections ?? {},
        name: clone.created.name ?? clone.templateName,
        nodes: remappedNodes,
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
  const folderEditorUrl = tenantFolderId
    ? buildFolderEditorUrl(projectId, tenantFolderId)
    : buildProjectEditorUrl(projectId);
  const editorUrl = buildEditorUrl(orchestratorId);

  const { error: upsertError } = await service.from("tenant_automation_settings").upsert(
    {
      inbound_automation_enabled: false,
      n8n_editor_url: editorUrl,
      n8n_folder_id: tenantFolderId,
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
    folderEditorUrl,
    folderId: tenantFolderId,
    provisionStatus: "draft",
    webhookUrl,
    workflowId: orchestratorId,
  };
};
