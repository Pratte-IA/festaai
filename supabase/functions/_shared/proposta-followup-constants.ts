export const PROPOSTA_FOLLOWUP_TEMPLATE_KEY = "follow-up-proposta";

export const PROPOSTA_FOLLOWUP_1_EVENT = "proposta_followup.followup_1";

export const PROPOSTA_FOLLOWUP_1_DELAY_HOURS = 48;

export const PROPOSTA_FOLLOWUP_2_EVENT = "proposta_followup.followup_2";

export const PROPOSTA_FOLLOWUP_2_DELAY_HOURS = 72;

export const PROPOSTA_FOLLOWUP_3_EVENT = "proposta_followup.followup_3";

export const PROPOSTA_FOLLOWUP_3_DELAY_HOURS = 72;

export const PROPOSTA_FOLLOWUP_4_EVENT = "proposta_followup.followup_4";

export const PROPOSTA_FOLLOWUP_4_DELAY_HOURS = 48;

export const PROPOSTA_FOLLOWUP_3_TEMPLATE_VISITA = "follow-up-proposta-3-visita";

export const PROPOSTA_FOLLOWUP_4_TEMPLATE_ENCERRAMENTO = "follow-up-proposta-4-encerramento";

export const PROPOSTA_FOLLOWUP_LOSS_MOTIVO =
  "Sem retorno após sequência de follow-ups de proposta";

export const PROPOSTA_FOLLOWUP_1_TEMPLATE_DATA_LIVRE = "follow-up-proposta-1-data-livre";

export const PROPOSTA_FOLLOWUP_1_TEMPLATE_DATA_INDISPONIVEL =
  "follow-up-proposta-1-data-indisponivel";

export const PROPOSTA_FOLLOWUP_2_TEMPLATE_DATA_LIVRE = "follow-up-proposta-2-data-livre";

export const PROPOSTA_FOLLOWUP_2_TEMPLATE_DATA_INDISPONIVEL =
  "follow-up-proposta-2-data-indisponivel";

export type PropostaFollowupDateVariante = "data_livre" | "data_indisponivel";

export type PropostaFollowup1Variante = PropostaFollowupDateVariante;

export type PropostaFollowup2Variante = PropostaFollowupDateVariante;

export type PropostaFollowupStatus =
  | "ativo"
  | "pausado_resposta"
  | "concluido_perdido"
  | "cancelado";

export const propostaFollowup1VarianteToTemplateKey = (
  variante: PropostaFollowup1Variante,
): string =>
  variante === "data_livre"
    ? PROPOSTA_FOLLOWUP_1_TEMPLATE_DATA_LIVRE
    : PROPOSTA_FOLLOWUP_1_TEMPLATE_DATA_INDISPONIVEL;

export const propostaFollowup2VarianteToTemplateKey = (
  variante: PropostaFollowup2Variante,
): string =>
  variante === "data_livre"
    ? PROPOSTA_FOLLOWUP_2_TEMPLATE_DATA_LIVRE
    : PROPOSTA_FOLLOWUP_2_TEMPLATE_DATA_INDISPONIVEL;
