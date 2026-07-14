import { phonesMatch } from "./phone.ts";

type ServiceClient = {
  from: (table: string) => Record<string, unknown>;
};

export interface PausePerdidoOportunidadeFollowupInput {
  customerPhone: string;
  respondedAt: string;
  tenantId: number;
}

export interface PausePerdidoOportunidadeFollowupResult {
  eventoId: number | null;
  followupKind: "fop" | "fup" | null;
  movedToPropostaEnviada: boolean;
  paused: boolean;
}

const resetCommercialFollowupFields = (respondedAt: string) => ({
  followup_0_enviado_em: null,
  followup_0b_enviado_em: null,
  followup_1_enviado_em: null,
  followup_1_variante: null,
  followup_2_enviado_em: null,
  followup_2_variante: null,
  followup_3_enviado_em: null,
  followup_4_enviado_em: null,
  followup_cancelado_motivo: null,
  followup_resposta_cliente_em: null,
  followup_status: "ativo",
  motivo_perda: null,
  proposta_enviada_em: respondedAt,
  status_interno: "ativo",
});

export const pausePerdidoOportunidadeFollowupOnCustomerReply = async (
  admin: ServiceClient,
  input: PausePerdidoOportunidadeFollowupInput,
): Promise<PausePerdidoOportunidadeFollowupResult> => {
  const { data: candidates, error: listError } = await admin
    .from("eventos")
    .select(
      "id, cliente_telefone, data_evento, etapa, fop1_enviado_em, fop2_enviado_em, fop3_enviado_em, fup1_enviado_em, fup_resposta_cliente_em, reativacao_festa_alvo, reativacao_status",
    )
    .eq("tenant_id", input.tenantId)
    .eq("funil", "vendas")
    .eq("etapa", "perdido")
    .order("updated_at", { ascending: false });

  if (listError) throw listError;

  const match = (candidates ?? []).find((evento) => {
    const hasOportunidadeFollowup =
      typeof evento.fup1_enviado_em === "string" ||
      typeof evento.fop1_enviado_em === "string" ||
      typeof evento.fop2_enviado_em === "string" ||
      typeof evento.fop3_enviado_em === "string";

    if (!hasOportunidadeFollowup) return false;

    return phonesMatch(
      typeof evento.cliente_telefone === "string" ? evento.cliente_telefone : null,
      input.customerPhone,
    );
  });

  if (!match) {
    return { eventoId: null, followupKind: null, movedToPropostaEnviada: false, paused: false };
  }

  const respostaBR = new Date(input.respondedAt).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  if (typeof match.fup1_enviado_em === "string" && !match.fup_resposta_cliente_em) {
    const dataEvento = typeof match.data_evento === "string" ? match.data_evento : null;

    const { error: updateError } = await admin
      .from("eventos")
      .update({
        ...resetCommercialFollowupFields(input.respondedAt),
        data_evento: dataEvento,
        etapa: "proposta_enviada",
        fup_resposta_cliente_em: input.respondedAt,
      })
      .eq("tenant_id", input.tenantId)
      .eq("id", match.id)
      .eq("etapa", "perdido")
      .not("fup1_enviado_em", "is", null)
      .is("fup_resposta_cliente_em", null);

    if (updateError) throw updateError;

    await admin.from("evento_notas").insert({
      evento_id: match.id,
      tenant_id: input.tenantId,
      texto:
        `[Automação] Cliente respondeu ao follow-up de oportunidade (FUP1) — ${respostaBR}\n` +
        "Lead movido para Proposta Enviada e sequência comercial de follow-up reiniciada.",
    });

    return {
      eventoId: match.id as number,
      followupKind: "fup",
      movedToPropostaEnviada: true,
      paused: true,
    };
  }

  if (match.reativacao_status === "pausado_resposta") {
    return { eventoId: match.id as number, followupKind: "fop", movedToPropostaEnviada: false, paused: false };
  }

  const hasFopSent =
    typeof match.fop1_enviado_em === "string" ||
    typeof match.fop2_enviado_em === "string" ||
    typeof match.fop3_enviado_em === "string";

  if (!hasFopSent || match.reativacao_status !== "ativo") {
    return { eventoId: null, followupKind: null, movedToPropostaEnviada: false, paused: false };
  }

  const targetPartyDate =
    typeof match.reativacao_festa_alvo === "string"
      ? match.reativacao_festa_alvo
      : typeof match.data_evento === "string"
        ? match.data_evento
        : null;

  const { error: updateError } = await admin
    .from("eventos")
    .update({
      ...resetCommercialFollowupFields(input.respondedAt),
      data_evento: targetPartyDate,
      etapa: "proposta_enviada",
      fop_resposta_cliente_em: input.respondedAt,
      reativacao_status: "cancelado",
    })
    .eq("tenant_id", input.tenantId)
    .eq("id", match.id)
    .eq("etapa", "perdido")
    .eq("reativacao_status", "ativo");

  if (updateError) throw updateError;

  await admin.from("evento_notas").insert({
    evento_id: match.id,
    tenant_id: input.tenantId,
    texto:
      `[Automação] Cliente respondeu ao follow-up de reativação (FOP) — ${respostaBR}\n` +
      "Lead movido para Proposta Enviada e sequência comercial de follow-up reiniciada.",
  });

  return {
    eventoId: match.id as number,
    followupKind: "fop",
    movedToPropostaEnviada: true,
    paused: true,
  };
};

/** @deprecated Use pausePerdidoOportunidadeFollowupOnCustomerReply */
export const pausePerdidoReativacaoFollowupOnCustomerReply = pausePerdidoOportunidadeFollowupOnCustomerReply;

export type PausePerdidoReativacaoFollowupInput = PausePerdidoOportunidadeFollowupInput;
export type PausePerdidoReativacaoFollowupResult = PausePerdidoOportunidadeFollowupResult;
