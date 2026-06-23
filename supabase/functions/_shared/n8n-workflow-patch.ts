import {
  AGENT_MEMORY_CONTEXT_WINDOW,
  AGENT_MEMORY_TABLE_NAME,
} from "./agent-memory.ts";
import type { N8nWorkflowNode } from "./n8n-provision-types.ts";

const POSTGRES_CHAT_MEMORY_NODE_TYPES = new Set([
  "@n8n/n8n-nodes-langchain.memoryPostgresChat",
  "n8n-nodes-langchain.memoryPostgresChat",
]);

/** Telefone do cliente no payload do webhook n8n (JSON HTTP fica em body). */
export const buildCustomerPhoneExpression = (webhookNodeName: string) => {
  const ref = `$('${escapeN8nNodeReference(webhookNodeName)}').first().json`;
  return `={{ ${ref}.body.message.customerPhone || ${ref}.message.customerPhone }}`;
};

export const buildEvolutionInstanceExpression = (webhookNodeName: string) => {
  const ref = `$('${escapeN8nNodeReference(webhookNodeName)}').first().json`;
  // Webhook n8n encapsula o POST JSON em json.body; FestaAi envia connection na raiz do body HTTP.
  return `={{ ${ref}.body.connection.instanceName || ${ref}.connection.instanceName }}`;
};

const escapeN8nNodeReference = (nodeName: string) => nodeName.replace(/'/g, "\\'");

const isEvolutionNode = (node: N8nWorkflowNode) =>
  (node.type ?? "").toLowerCase().includes("evolution");

const isSendTextNode = (node: N8nWorkflowNode, parameters: Record<string, unknown>) => {
  const operation = String(parameters.operation ?? "").toLowerCase();
  const resource = String(parameters.resource ?? "").toLowerCase();
  const nodeName = (node.name ?? "").toLowerCase();

  if (operation === "send-text" || operation === "sendtext") return true;
  if (resource.includes("message") && operation.includes("send") && operation.includes("text")) return true;

  // Evolution API community node: operation omitido no JSON exportado; messageText identifica envio de texto.
  if (typeof parameters.messageText === "string") return true;

  if (nodeName.includes("enviar texto") || nodeName.includes("send text")) return true;

  return false;
};

const hasCustomRecipientExpression = (value: unknown): boolean => {
  if (typeof value !== "string") return false;
  if (!value.includes("$(") && !value.includes("$json")) return false;
  if (value.includes("customerPhone")) return true;
  return value.includes("$(");
};

/**
 * Conecta nodes Evolution "enviar texto" ao payload inbound da FestaAi:
 * - instanceName → instância WhatsApp do tenant na plataforma (via node Webhook)
 * - remoteJid/number → telefone do cliente (somente se ainda não customizado)
 */
export const patchEvolutionSendTextNodes = (
  nodes: N8nWorkflowNode[],
  webhookNodeName = "Webhook",
): N8nWorkflowNode[] => {
  const instanceExpression = buildEvolutionInstanceExpression(webhookNodeName);
  const customerPhoneExpression = buildCustomerPhoneExpression(webhookNodeName);

  return nodes.map((node) => {
    if (!isEvolutionNode(node)) return node;

    const parameters = { ...(node.parameters ?? {}) };
    if (!isSendTextNode(node, parameters)) return node;

    parameters.instanceName = instanceExpression;

    const remoteJid = parameters.remoteJid;
    if ("remoteJid" in parameters && !hasCustomRecipientExpression(remoteJid)) {
      parameters.remoteJid = customerPhoneExpression;
    }

    if ("number" in parameters && !hasCustomRecipientExpression(parameters.number)) {
      parameters.number = customerPhoneExpression;
    }

    return { ...node, parameters };
  });
};

export const findWebhookNodeName = (nodes: N8nWorkflowNode[]): string => {
  const webhook = nodes.find((node) => node.type === "n8n-nodes-base.webhook");
  return webhook?.name ?? "Webhook";
};

/** session_id = tenant_id:customerPhone — isolamento multi-tenant no Postgres Chat Memory. */
export const buildAgentMemorySessionExpression = (webhookNodeName: string) => {
  const ref = `$('${escapeN8nNodeReference(webhookNodeName)}').first().json`;
  const tenantId = `${ref}.body.tenant.id || ${ref}.tenant.id`;
  const customerPhone = `${ref}.body.message.customerPhone || ${ref}.message.customerPhone`;
  return `={{ String(${tenantId}) + ':' + String(${customerPhone}) }}`;
};

const isPostgresChatMemoryNode = (node: N8nWorkflowNode) =>
  POSTGRES_CHAT_MEMORY_NODE_TYPES.has(node.type ?? "");

/**
 * Configura Postgres Chat Memory com session key multi-tenant e tabela padronizada.
 */
export const patchPostgresChatMemoryNodes = (
  nodes: N8nWorkflowNode[],
  webhookNodeName = "Webhook",
): N8nWorkflowNode[] => {
  const sessionExpression = buildAgentMemorySessionExpression(webhookNodeName);

  return nodes.map((node) => {
    if (!isPostgresChatMemoryNode(node)) return node;

    const parameters = { ...(node.parameters ?? {}) };

    parameters.sessionIdType = "customKey";
    parameters.sessionKey = sessionExpression;
    parameters.tableName = AGENT_MEMORY_TABLE_NAME;

    if (parameters.contextWindowLength === undefined) {
      parameters.contextWindowLength = AGENT_MEMORY_CONTEXT_WINDOW;
    }

    return { ...node, parameters };
  });
};

/** Evolution send-text + Postgres Chat Memory em um único patch de workflow. */
export const patchTenantWorkflowNodes = (
  nodes: N8nWorkflowNode[],
  webhookNodeName = "Webhook",
): N8nWorkflowNode[] => {
  const withEvolution = patchEvolutionSendTextNodes(nodes, webhookNodeName);
  return patchPostgresChatMemoryNodes(withEvolution, webhookNodeName);
};
