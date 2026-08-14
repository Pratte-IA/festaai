import { toWhatsAppPhoneKey } from "./phone.ts";

/** Tabela padrão do node Postgres Chat Memory do n8n. */
export const AGENT_MEMORY_TABLE_NAME = "n8n_chat_histories";

/** Retenção padrão para purge_agent_chat_memory (dias). */
export const AGENT_MEMORY_RETENTION_DAYS = 90;

/** Janela de contexto recomendada no n8n Postgres Chat Memory. */
export const AGENT_MEMORY_CONTEXT_WINDOW = 20;

/** session_id composto: tenant_id + telefone WhatsApp/Evolution (sem nono dígito). */
export const buildAgentSessionId = (tenantId: number, customerPhone: string): string => {
  const phoneKey = toWhatsAppPhoneKey(customerPhone) ?? customerPhone;
  return `${tenantId}:${phoneKey}`;
};

type AgentMessageService = {
  from: (table: string) => {
    insert: (values: Record<string, unknown>) => Promise<{ error: { code?: string; message?: string } | null }>;
  };
};

export interface PersistAgentMessageInput {
  connectionId: number;
  content: string;
  customerPhone: string;
  messageId?: string | null;
  metadata?: Record<string, unknown>;
  role: "human" | "ai" | "system";
  tenantId: number;
}

export const persistAgentConversationMessage = async (
  service: AgentMessageService,
  input: PersistAgentMessageInput,
): Promise<void> => {
  const phoneKey = toWhatsAppPhoneKey(input.customerPhone) ?? input.customerPhone;
  const sessionId = buildAgentSessionId(input.tenantId, phoneKey);

  const { error } = await service.from("agent_conversation_messages").insert({
    connection_id: input.connectionId,
    content: input.content,
    customer_phone: phoneKey,
    message_id: input.messageId ?? null,
    metadata: input.metadata ?? {},
    role: input.role,
    session_id: sessionId,
    tenant_id: input.tenantId,
  });

  if (!error) return;

  // Dedupe: mesma mensagem WhatsApp já registrada.
  if (error.code === "23505") return;

  throw error;
};

const langChainRoleFromAgentRole = (role: PersistAgentMessageInput["role"]): string => {
  if (role === "human") return "human";
  if (role === "system") return "system";
  return "ai";
};

/**
 * Formato que o Postgres Chat Memory do n8n grava e lê.
 * O node achata `{ type, data: { content } }` em `{ type, content, ... }` na escrita;
 * na leitura, tudo exceto `type` vira `kwargs` da AIMessage. Se o texto ficar só em
 * `data.content`, o modelo recebe o turno de IA vazio.
 */
export const buildN8nChatHistoryStoredMessage = (
  role: PersistAgentMessageInput["role"],
  content: string,
): Record<string, unknown> => {
  const type = langChainRoleFromAgentRole(role);
  const message: Record<string, unknown> = {
    additional_kwargs: {},
    content,
    response_metadata: {},
    type,
  };

  if (type === "ai") {
    message.invalid_tool_calls = [];
    message.tool_calls = [];
  }

  return message;
};

/** Grava mensagem outbound/inbound também no histórico LangChain do n8n. */
export const persistN8nChatHistoryMessage = async (
  service: AgentMessageService,
  input: PersistAgentMessageInput,
): Promise<void> => {
  const phoneKey = toWhatsAppPhoneKey(input.customerPhone) ?? input.customerPhone;
  const sessionId = buildAgentSessionId(input.tenantId, phoneKey);

  const { error } = await service.from(AGENT_MEMORY_TABLE_NAME).insert({
    message: buildN8nChatHistoryStoredMessage(input.role, input.content),
    session_id: sessionId,
  });

  if (error) throw error;
};

export const persistAgentOutboundAutomationMessage = async (
  service: AgentMessageService,
  input: PersistAgentMessageInput,
): Promise<void> => {
  await persistAgentConversationMessage(service, input);
  await persistN8nChatHistoryMessage(service, input);
};
