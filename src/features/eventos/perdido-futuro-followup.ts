export {
  PERDIDO_REATIVACAO_TEMPLATE_KEY as PERDIDO_OPORTUNIDADE_TEMPLATE_KEY,
} from "./perdido-reativacao-followup";

export const PERDIDO_FUTURO_FUP1_TEMPLATE_DATA_LIVRE = "follow-up-perdido-futuro-fup1-data-livre";

export const PERDIDO_FUTURO_FUP1_TEMPLATE_DATA_INDISPONIVEL =
  "follow-up-perdido-futuro-fup1-data-indisponivel";

export const PERDIDO_FUTURO_FUP1_EVENT = "perdido_futuro.fup1";

export type PerdidoFuturoFup1Variante = "data_livre" | "data_indisponivel";

export { PERDIDO_FUTURO_FUP1_DAYS_BEFORE } from "./perdido-futuro-schedule";

export const perdidoFuturoFup1VarianteToTemplateKey = (
  variante: PerdidoFuturoFup1Variante,
): string =>
  variante === "data_livre"
    ? PERDIDO_FUTURO_FUP1_TEMPLATE_DATA_LIVRE
    : PERDIDO_FUTURO_FUP1_TEMPLATE_DATA_INDISPONIVEL;

export const DEFAULT_PERDIDO_FUTURO_FUP1_DATA_LIVRE = `Oi, {{primeiro_nome}}! Tudo bem? 🥰

Lembrei da festa do(a) {{nome_aniversariante}}, prevista para {{data_festa}}, e passei para saber se vocês já decidiram onde será a comemoração. 🎉

Consultei nossa agenda e tenho uma boa notícia: essa data ainda está disponível para vocês. ✨

Como faltam cerca de 60 dias, este é um ótimo momento para organizar tudo com calma, definir os detalhes e garantir a data antes que ela seja reservada.

Vamos preparar uma festa linda e inesquecível para o(a) {{nome_aniversariante}} aqui na Vila Encantada? 💛`;

export const DEFAULT_PERDIDO_FUTURO_FUP1_DATA_INDISPONIVEL = `Oi, {{primeiro_nome}}! Tudo bem? 🥰

Lembrei da festa do(a) {{nome_aniversariante}}, prevista para {{data_festa}}, e passei para saber se vocês já decidiram onde será a comemoração. 🎉

Consultei nossa agenda e essa data já foi reservada, mas ainda temos outras opções próximas disponíveis. ✨

Como faltam cerca de 60 dias, ainda dá tempo de organizar uma festa linda, com tranquilidade e todo o carinho que esse momento merece.

Queremos muito receber vocês aqui na Vila Encantada para comemorar esse dia especial! 💛

Vamos verificar uma nova data?`;

export const getPerdidoFuturoKanbanBadge = (evento: {
  etapa: string;
  fup1_enviado_em?: string | null;
  fup_resposta_cliente_em?: string | null;
}): { className: string; label: string } | null => {
  if (evento.etapa !== "perdido") return null;
  if (evento.fup_resposta_cliente_em) return null;

  if (evento.fup1_enviado_em) {
    return { className: "bg-success/15 text-success", label: "FUP1 ✓" };
  }

  return null;
};

export const getPerdidoFuturoRespondedKanbanBadge = (evento: {
  etapa: string;
  fup1_enviado_em?: string | null;
  fup_resposta_cliente_em?: string | null;
}): { className: string; label: string } | null => {
  if (evento.etapa !== "perdido") return null;
  if (!evento.fup1_enviado_em || !evento.fup_resposta_cliente_em) return null;

  return { className: "bg-primary/15 text-primary", label: "Respondeu" };
};

export const getPerdidoOportunidadeKanbanBadge = (evento: {
  etapa: string;
  fop1_enviado_em?: string | null;
  fop2_enviado_em?: string | null;
  fop3_enviado_em?: string | null;
  fup1_enviado_em?: string | null;
  fup_resposta_cliente_em?: string | null;
  reativacao_status?: string | null;
}): { className: string; label: string } | null => {
  const futuroBadge = getPerdidoFuturoKanbanBadge(evento);
  if (futuroBadge) return futuroBadge;

  if (evento.etapa !== "perdido") return null;
  if (evento.reativacao_status === "cancelado" || evento.reativacao_status === "pausado_resposta") {
    return null;
  }

  if (evento.fop3_enviado_em) {
    return { className: "bg-success/15 text-success", label: "FOP3 ✓" };
  }

  if (evento.fop2_enviado_em) {
    return { className: "bg-success/15 text-success", label: "FOP2 ✓" };
  }

  if (evento.fop1_enviado_em) {
    return { className: "bg-success/15 text-success", label: "FOP1 ✓" };
  }

  return null;
};

export const getPerdidoOportunidadeRespondedKanbanBadge = (evento: {
  etapa: string;
  fop1_enviado_em?: string | null;
  fop2_enviado_em?: string | null;
  fop3_enviado_em?: string | null;
  fop_resposta_cliente_em?: string | null;
  fup1_enviado_em?: string | null;
  fup_resposta_cliente_em?: string | null;
  reativacao_status?: string | null;
}): { className: string; label: string } | null => {
  const futuroResponded = getPerdidoFuturoRespondedKanbanBadge(evento);
  if (futuroResponded) return futuroResponded;

  if (evento.etapa !== "perdido") return null;
  if (evento.reativacao_status !== "pausado_resposta") return null;
  if (!evento.fop_resposta_cliente_em) return null;

  return { className: "bg-primary/15 text-primary", label: "Respondeu" };
};
