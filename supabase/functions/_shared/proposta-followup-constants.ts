export const PROPOSTA_FOLLOWUP_TEMPLATE_KEY = "follow-up-proposta";

export const PROPOSTA_FOLLOWUP_0_EVENT = "proposta_followup.followup_0";

export const PROPOSTA_FOLLOWUP_0_DELAY_HOURS = 12;

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

export const PROPOSTA_FOLLOWUP_0_TEMPLATE_CONTATO_INICIAL = "follow-up-proposta-0-contato-inicial";

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

// Janela de horário comercial do FU0 (referência: America/Sao_Paulo).
export const PROPOSTA_FOLLOWUP_TIMEZONE = "America/Sao_Paulo";

export const PROPOSTA_FOLLOWUP_0_BUSINESS_HOUR_START = 8;

export const PROPOSTA_FOLLOWUP_0_BUSINESS_HOUR_END = 18;

const getHourInTimezone = (date: Date, timeZone: string): number => {
  const formatted = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hourCycle: "h23",
    timeZone,
  }).format(date);
  const hour = Number.parseInt(formatted, 10);
  return Number.isNaN(hour) ? date.getHours() : hour % 24;
};

/**
 * FU0 só é disparado dentro do horário comercial (08h–18h) no fuso de referência.
 * O cron roda de hora em hora; este gate evita enviar mensagens fora do horário.
 */
export const isWithinPropostaFollowup0BusinessHours = (date = new Date()): boolean => {
  const hour = getHourInTimezone(date, PROPOSTA_FOLLOWUP_TIMEZONE);
  return (
    hour >= PROPOSTA_FOLLOWUP_0_BUSINESS_HOUR_START &&
    hour < PROPOSTA_FOLLOWUP_0_BUSINESS_HOUR_END
  );
};
