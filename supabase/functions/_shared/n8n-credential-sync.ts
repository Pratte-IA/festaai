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

const patchEvolutionCredentialApiKey = async (credentialId: string, instanceApiKey: string) => {
  await n8nApiFetch(`/credentials/${credentialId}`, {
    body: JSON.stringify({
      data: {
        allowedDomains: "all",
        apikey: instanceApiKey.trim(),
      },
      isPartialData: true,
    }),
    method: "PATCH",
  });
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
