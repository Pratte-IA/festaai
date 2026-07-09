import { buildAgentSessionId } from "./agent-memory.ts";
import { phonesMatch, toWhatsAppPhoneKey } from "./phone.ts";

type ServiceClient = {
  from: (table: string) => Record<string, unknown>;
};

const INACTIVE_STATUSES = new Set(["perdido", "cancelado"]);

interface ContatoInicialLeadRow {
  id: number;
  cliente_telefone: string | null;
  contato_inicial_ultima_mensagem_em: string | null;
  status_interno: string | null;
}

const findActiveContatoInicialLead = async (
  admin: ServiceClient,
  tenantId: number,
  customerPhone: string,
): Promise<ContatoInicialLeadRow | null> => {
  const { data: candidates, error } = await admin
    .from("eventos")
    .select("id, cliente_telefone, contato_inicial_ultima_mensagem_em, status_interno")
    .eq("tenant_id", tenantId)
    .eq("funil", "vendas")
    .eq("etapa", "contato_inicial")
    .is("followup_0_enviado_em", null)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  const match = ((candidates ?? []) as ContatoInicialLeadRow[]).find(
    (evento) =>
      !INACTIVE_STATUSES.has(evento.status_interno ?? "") &&
      phonesMatch(evento.cliente_telefone, customerPhone),
  );

  return match ?? null;
};

const extractChatMessageType = (message: unknown): "ai" | "human" | null => {
  if (!message || typeof message !== "object") return null;
  const record = message as Record<string, unknown>;
  const direct = typeof record.type === "string" ? record.type : null;
  if (direct === "ai" || direct === "human") return direct;

  const nested = record.data;
  if (nested && typeof nested === "object") {
    const nestedType = (nested as Record<string, unknown>).type;
    if (nestedType === "ai" || nestedType === "human") return nestedType;
  }

  return null;
};

/**
 * Resolve desde quando estamos aguardando o retorno do cliente no contato
 * inicial. Fonte da verdade: histórico do agente (n8n) — a última mensagem
 * relevante precisa ser nossa (AI). Respostas da IA via n8n não ecoam no
 * webhook Evolution como fromMe, então o marco na coluna sozinho não basta.
 */
export const resolveContatoInicialAwaitingReplySince = async (
  admin: ServiceClient,
  input: { customerPhone: string | null; tenantId: number },
): Promise<string | null> => {
  const phoneKey = toWhatsAppPhoneKey(input.customerPhone);
  if (!phoneKey) return null;

  const sessionId = buildAgentSessionId(input.tenantId, phoneKey);

  const { data, error } = await admin
    .from("n8n_chat_histories")
    .select("id, created_at, message")
    .eq("session_id", sessionId)
    .order("id", { ascending: false })
    .limit(30);

  if (error) throw error;

  for (const row of (data ?? []) as Array<{
    created_at: string;
    message: unknown;
  }>) {
    const type = extractChatMessageType(row.message);
    if (type === "ai") return row.created_at;
    if (type === "human") return null;
  }

  return null;
};

/**
 * Sincroniza o marco em eventos com o histórico do agente (para badge/Kanban).
 * Só grava quando ainda estamos aguardando retorno após a nossa última mensagem.
 */
export const syncContatoInicialUltimaMensagemMarco = async (
  admin: ServiceClient,
  input: {
    awaitingSince: string | null;
    eventoId: number;
    tenantId: number;
  },
): Promise<void> => {
  const { error } = await admin
    .from("eventos")
    .update({ contato_inicial_ultima_mensagem_em: input.awaitingSince })
    .eq("tenant_id", input.tenantId)
    .eq("id", input.eventoId)
    .eq("etapa", "contato_inicial")
    .is("followup_0_enviado_em", null);

  if (error) throw error;
};

export interface MarkContatoInicialOutboundInput {
  customerPhone: string;
  sentAt: string;
  tenantId: number;
}

export interface MarkContatoInicialOutboundResult {
  eventoId: number | null;
  updated: boolean;
}

/**
 * Registra a nossa última mensagem enviada a um lead em contato inicial
 * (ex.: mensagem manual fromMe no WhatsApp de Atendimento).
 */
export const markContatoInicialFollowupOutbound = async (
  admin: ServiceClient,
  input: MarkContatoInicialOutboundInput,
): Promise<MarkContatoInicialOutboundResult> => {
  const match = await findActiveContatoInicialLead(admin, input.tenantId, input.customerPhone);
  if (!match) {
    return { eventoId: null, updated: false };
  }

  const { error: updateError } = await admin
    .from("eventos")
    .update({ contato_inicial_ultima_mensagem_em: input.sentAt })
    .eq("tenant_id", input.tenantId)
    .eq("id", match.id)
    .eq("etapa", "contato_inicial")
    .is("followup_0_enviado_em", null);

  if (updateError) throw updateError;

  return { eventoId: match.id, updated: true };
};

export interface PauseContatoInicialFollowupInput {
  customerPhone: string;
  tenantId: number;
}

export interface PauseContatoInicialFollowupResult {
  eventoId: number | null;
  paused: boolean;
}

/**
 * Cliente respondeu: zera o marco. O cron também valida no histórico n8n
 * (última mensagem humana ⇒ sem FU0).
 */
export const pauseContatoInicialFollowupOnCustomerReply = async (
  admin: ServiceClient,
  input: PauseContatoInicialFollowupInput,
): Promise<PauseContatoInicialFollowupResult> => {
  const match = await findActiveContatoInicialLead(admin, input.tenantId, input.customerPhone);
  if (!match) {
    return { eventoId: null, paused: false };
  }

  if (!match.contato_inicial_ultima_mensagem_em) {
    return { eventoId: match.id, paused: false };
  }

  const { error: updateError } = await admin
    .from("eventos")
    .update({ contato_inicial_ultima_mensagem_em: null })
    .eq("tenant_id", input.tenantId)
    .eq("id", match.id)
    .eq("etapa", "contato_inicial")
    .is("followup_0_enviado_em", null);

  if (updateError) throw updateError;

  return { eventoId: match.id, paused: true };
};
