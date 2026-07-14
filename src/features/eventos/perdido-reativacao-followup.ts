export const PERDIDO_REATIVACAO_TEMPLATE_KEY = "follow-up-perdido-reativacao";

export const PERDIDO_REATIVACAO_FOP1_TEMPLATE = "follow-up-perdido-reativacao-fop1";

export const PERDIDO_REATIVACAO_FOP2_TEMPLATE = "follow-up-perdido-reativacao-fop2";

export const PERDIDO_REATIVACAO_FOP3_TEMPLATE = "follow-up-perdido-reativacao-fop3";

export const PERDIDO_REATIVACAO_FOP1_EVENT = "perdido_reativacao.fop1";

export const PERDIDO_REATIVACAO_FOP2_EVENT = "perdido_reativacao.fop2";

export const PERDIDO_REATIVACAO_FOP3_EVENT = "perdido_reativacao.fop3";

export type PerdidoReativacaoStatus = "ativo" | "pausado_resposta" | "cancelado";

export const perdidoReativacaoStatusLabels: Record<PerdidoReativacaoStatus, string> = {
  ativo: "Reativação ativa",
  cancelado: "Reativação encerrada",
  pausado_resposta: "Cliente respondeu",
};

export {
  PERDIDO_REATIVACAO_FOP1_MONTHS_BEFORE,
  PERDIDO_REATIVACAO_FOP2_DELAY_DAYS,
  PERDIDO_REATIVACAO_FOP3_DAYS_BEFORE,
} from "./perdido-reativacao-schedule";

export const DEFAULT_PERDIDO_REATIVACAO_FOP1 = `Oi, {{primeiro_nome}}! Tudo bem? 🥰

No ano passado, você conversou com a gente sobre a festa do(a) {{nome_aniversariante}}, e lembrei de vocês porque já estamos começando a organizar as comemorações para {{mes_festa}}. 🎉

Como ainda faltam alguns meses, este é um ótimo momento para planejar tudo com calma, escolher uma boa data e conhecer as opções de festa da Vila Encantada. ✨

Vocês já começaram a pensar no aniversário deste ano?

Posso te enviar as opções e valores atualizados, sem compromisso. 😊`;

export const DEFAULT_PERDIDO_REATIVACAO_FOP2 = `Oi, {{primeiro_nome}}! Tudo bem? 🥰

Passei novamente porque estamos organizando as festas de {{mes_festa}} e ainda temos algumas possibilidades de datas para esse período. 🎉

Como o aniversário do(a) {{nome_aniversariante}} está se aproximando, queria saber se vocês já decidiram como será a comemoração deste ano.

Aqui na Vila Encantada temos opções desde a locação do espaço até pacotes completos, e posso te ajudar a encontrar uma opção que combine com o que vocês estão planejando. ✨

Quer que eu te envie as opções atualizadas?`;

export const DEFAULT_PERDIDO_REATIVACAO_FOP3 = `Oi, {{primeiro_nome}}! Tudo bem? 🥰

O aniversário do(a) {{nome_aniversariante}} está se aproximando, e como faltam cerca de 3 meses, passei para saber se vocês já decidiram como será a comemoração deste ano. 🎉

Nossa agenda para {{mes_festa}} já está começando a preencher, e ainda temos algumas possibilidades de datas e horários disponíveis.

Na Vila Encantada, temos opções desde a locação do espaço até pacotes completos, para deixar a organização mais prática e tranquila para você. ✨

Quer que eu verifique as datas disponíveis e te envie as opções atualizadas?`;

export const getPerdidoReativacaoKanbanBadge = (evento: {
  etapa: string;
  fop1_enviado_em?: string | null;
  fop2_enviado_em?: string | null;
  fop3_enviado_em?: string | null;
  reativacao_status?: string | null;
}): { className: string; label: string } | null => {
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

export const getPerdidoReativacaoRespondedKanbanBadge = (evento: {
  etapa: string;
  fop_resposta_cliente_em?: string | null;
  reativacao_status?: string | null;
}): { className: string; label: string } | null => {
  if (evento.etapa !== "perdido") return null;
  if (evento.reativacao_status !== "pausado_resposta") return null;
  if (!evento.fop_resposta_cliente_em) return null;

  return { className: "bg-primary/15 text-primary", label: "Respondeu" };
};
