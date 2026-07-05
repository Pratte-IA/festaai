import { n8nApiFetch } from "./n8n-api.ts";
import type { N8nWorkflowNode } from "./n8n-provision-types.ts";

interface N8nCredentialSummary {
  id: string;
  name?: string;
  type?: string;
}

const normalizeLabel = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const isEvolutionCredentialType = (type: string | undefined) => {
  const normalized = (type ?? "").toLowerCase();
  return normalized.includes("evolution");
};

const extractCredentialFromWorkflowNodes = (nodes: N8nWorkflowNode[]): N8nCredentialSummary | null => {
  for (const node of nodes) {
    if (!(node.type ?? "").toLowerCase().includes("evolution")) continue;

    for (const credential of Object.values(node.credentials ?? {})) {
      if (credential?.id) {
        return { id: credential.id, name: credential.name };
      }
    }
  }

  return null;
};

const listCredentials = async (): Promise<N8nCredentialSummary[]> => {
  const response = await n8nApiFetch<{ data?: N8nCredentialSummary[] }>("/credentials");
  return response.data ?? [];
};

const findEvolutionCredentialForTenant = (
  credentials: N8nCredentialSummary[],
  tenant: { name: string; slug: string },
): N8nCredentialSummary | null => {
  const explicitName = Deno.env.get("N8N_EVOLUTION_CREDENTIAL_NAME")?.trim();
  if (explicitName) {
    const exact = credentials.find((item) => item.name === explicitName);
    if (exact) return exact;
  }

  const tenantName = normalizeLabel(tenant.name);
  const tenantSlug = normalizeLabel(tenant.slug.replace(/-/g, " "));

  const evolutionCredentials = credentials.filter((item) => isEvolutionCredentialType(item.type));

  for (const credential of evolutionCredentials) {
    const credentialName = normalizeLabel(credential.name ?? "");
    if (!credentialName) continue;
    if (credentialName === tenantName || credentialName === tenantSlug) return credential;
    if (credentialName.includes(tenantName) || credentialName.includes(tenantSlug)) return credential;
  }

  return evolutionCredentials[0] ?? null;
};

const resolveEvolutionServerUrl = () => {
  const base =
    Deno.env.get("EVOLUTION_API_BASE_URL") ??
    Deno.env.get("EVOLUTION_API_URL") ??
    "";
  return base.replace(/\/$/, "");
};

const buildEvolutionCredentialData = (instanceApiKey: string) => {
  const data: Record<string, string> = {
    allowedDomains: "all",
    apikey: instanceApiKey.trim(),
  };

  const serverUrl = resolveEvolutionServerUrl();
  if (serverUrl) {
    data["server-url"] = serverUrl;
  }

  return data;
};

const patchEvolutionCredentialApiKey = async (credentialId: string, instanceApiKey: string) => {
  await n8nApiFetch(`/credentials/${credentialId}`, {
    body: JSON.stringify({
      data: buildEvolutionCredentialData(instanceApiKey),
      isPartialData: true,
    }),
    method: "PATCH",
  });
};

/** Nome da credencial Evolution no n8n — conexão principal usa só o tenant; demais incluem o rótulo. */
export const buildConnectionEvolutionCredentialName = (
  tenant: { name: string },
  connection: { name: string },
  options?: { isPrimary?: boolean },
) => {
  if (options?.isPrimary) return tenant.name.trim();
  return `${tenant.name.trim()} - ${connection.name.trim()}`;
};

const findEvolutionCredentialByName = (
  credentials: N8nCredentialSummary[],
  credentialName: string,
): N8nCredentialSummary | null => {
  const normalizedTarget = normalizeLabel(credentialName);
  return (
    credentials.find((item) => normalizeLabel(item.name ?? "") === normalizedTarget) ??
    credentials.find((item) => (item.name ?? "").trim() === credentialName.trim()) ??
    null
  );
};

const createEvolutionCredential = async (
  credentialName: string,
  instanceApiKey: string,
): Promise<N8nCredentialSummary> => {
  const created = await n8nApiFetch<N8nCredentialSummary>("/credentials", {
    body: JSON.stringify({
      data: buildEvolutionCredentialData(instanceApiKey),
      name: credentialName.trim(),
      type: "evolutionApi",
    }),
    method: "POST",
  });

  if (!created.id) {
    throw new Error(`Falha ao criar credencial Evolution "${credentialName}" no n8n.`);
  }

  return created;
};

/**
 * Garante uma credencial Evolution dedicada por conexão WhatsApp (multi-número).
 * Cada instância Evolution exige apikey própria — compartilhar uma credencial quebra envios.
 */
export const ensureConnectionEvolutionCredential = async (
  tenant: { name: string; slug: string },
  connection: { name: string },
  instanceApiKey: string,
  options?: { isPrimary?: boolean; workflowNodes?: N8nWorkflowNode[] },
): Promise<{ credentialId: string; credentialName: string }> => {
  if (!instanceApiKey.trim()) {
    throw new Error("Token da instância Evolution ausente para sincronizar credencial.");
  }

  const explicitCredentialId = Deno.env.get("N8N_EVOLUTION_CREDENTIAL_ID")?.trim();
  if (explicitCredentialId) {
    await patchEvolutionCredentialApiKey(explicitCredentialId, instanceApiKey);
    return { credentialId: explicitCredentialId, credentialName: tenant.name };
  }

  const credentialName = buildConnectionEvolutionCredentialName(tenant, connection, options);

  const fromWorkflow = options?.workflowNodes
    ? extractCredentialFromWorkflowNodes(options.workflowNodes)
    : null;

  if (fromWorkflow?.id) {
    const workflowCredentialName = (fromWorkflow.name ?? "").trim();
    if (
      workflowCredentialName &&
      normalizeLabel(workflowCredentialName) === normalizeLabel(credentialName)
    ) {
      await patchEvolutionCredentialApiKey(fromWorkflow.id, instanceApiKey);
      return { credentialId: fromWorkflow.id, credentialName: workflowCredentialName };
    }
  }

  let credentials: N8nCredentialSummary[] = [];
  try {
    credentials = await listCredentials();
  } catch {
    credentials = [];
  }

  const byName = findEvolutionCredentialByName(credentials, credentialName);
  if (byName?.id) {
    await patchEvolutionCredentialApiKey(byName.id, instanceApiKey);
    return { credentialId: byName.id, credentialName: byName.name ?? credentialName };
  }

  if (fromWorkflow?.id && options?.isPrimary) {
    await patchEvolutionCredentialApiKey(fromWorkflow.id, instanceApiKey);
    return {
      credentialId: fromWorkflow.id,
      credentialName: fromWorkflow.name ?? credentialName,
    };
  }

  const tenantFallback = findEvolutionCredentialForTenant(credentials, tenant);
  if (tenantFallback?.id && options?.isPrimary) {
    await patchEvolutionCredentialApiKey(tenantFallback.id, instanceApiKey);
    return {
      credentialId: tenantFallback.id,
      credentialName: tenantFallback.name ?? credentialName,
    };
  }

  try {
    const created = await createEvolutionCredential(credentialName, instanceApiKey);
    return { credentialId: created.id!, credentialName: created.name ?? credentialName };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.toLowerCase().includes("already exists")) throw error;

    const retryMatch = findEvolutionCredentialByName(await listCredentials(), credentialName);
    if (!retryMatch?.id) throw error;

    await patchEvolutionCredentialApiKey(retryMatch.id, instanceApiKey);
    return { credentialId: retryMatch.id, credentialName: retryMatch.name ?? credentialName };
  }
};

/**
 * Atualiza a apikey da credencial Evolution no n8n com o token da instância conectada na FestaAi.
 */
export const syncTenantEvolutionCredential = async (
  tenant: { name: string; slug: string },
  instanceApiKey: string,
  workflowNodes?: N8nWorkflowNode[],
): Promise<{ credentialId: string; credentialName: string } | null> => {
  if (!instanceApiKey.trim()) return null;

  const explicitCredentialId = Deno.env.get("N8N_EVOLUTION_CREDENTIAL_ID")?.trim();
  if (explicitCredentialId) {
    await patchEvolutionCredentialApiKey(explicitCredentialId, instanceApiKey);
    return { credentialId: explicitCredentialId, credentialName: tenant.name };
  }

  const fromWorkflow = workflowNodes ? extractCredentialFromWorkflowNodes(workflowNodes) : null;
  if (fromWorkflow?.id) {
    await patchEvolutionCredentialApiKey(fromWorkflow.id, instanceApiKey);
    return {
      credentialId: fromWorkflow.id,
      credentialName: fromWorkflow.name ?? fromWorkflow.id,
    };
  }

  const credentials = await listCredentials();
  const match = findEvolutionCredentialForTenant(credentials, tenant);
  if (!match?.id) return null;

  await patchEvolutionCredentialApiKey(match.id, instanceApiKey);

  return {
    credentialId: match.id,
    credentialName: match.name ?? match.id,
  };
};
