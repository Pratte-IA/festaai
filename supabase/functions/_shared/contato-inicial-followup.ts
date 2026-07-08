import { phonesMatch } from "./phone.ts";

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
 * Registra a nossa última mensagem enviada a um lead em contato inicial.
 * É o marco que inicia (ou reinicia) o timer de 12h do FU0.
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
 * Cliente respondeu no contato inicial: zeramos o marco para o timer de 12h só
 * voltar a contar depois da nossa próxima mensagem. Assim o FU0 nunca dispara
 * enquanto o cliente estiver conversando.
 */
export const pauseContatoInicialFollowupOnCustomerReply = async (
  admin: ServiceClient,
  input: PauseContatoInicialFollowupInput,
): Promise<PauseContatoInicialFollowupResult> => {
  const match = await findActiveContatoInicialLead(admin, input.tenantId, input.customerPhone);
  if (!match || !match.contato_inicial_ultima_mensagem_em) {
    return { eventoId: match?.id ?? null, paused: false };
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
