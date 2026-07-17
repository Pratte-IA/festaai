import {
  addYearsToIsoDate,
  formatMesFestaBR,
  getBrazilTodayIsoDate,
  getFop1TriggerDate as getFof1TriggerDate,
  getFop2TriggerDate as getFof2TriggerDate,
  getFop3TriggerDate as getFof3TriggerDate,
  getReativacaoTargetPartyDate as getFofTargetPartyDate,
  isIsoDateOnOrBefore,
  isPastPartyForReativacao as isPastPartyForFof,
  PERDIDO_REATIVACAO_FOP1_MONTHS_BEFORE as OPORTUNIDADE_FUTURA_FOF1_MONTHS_BEFORE,
  PERDIDO_REATIVACAO_FOP2_DELAY_DAYS as OPORTUNIDADE_FUTURA_FOF2_DELAY_DAYS,
  PERDIDO_REATIVACAO_FOP3_DAYS_BEFORE as OPORTUNIDADE_FUTURA_FOF3_DAYS_BEFORE,
  PERDIDO_REATIVACAO_TEMPLATE_KEY as OPORTUNIDADE_FUTURA_WHATSAPP_BINDING_KEY,
  shouldResetReativacaoCycle as shouldResetFofCycle,
} from "./perdido-reativacao-constants.ts";

export {
  addYearsToIsoDate,
  formatMesFestaBR,
  getBrazilTodayIsoDate,
  getFof1TriggerDate,
  getFof2TriggerDate,
  getFof3TriggerDate,
  getFofTargetPartyDate,
  isIsoDateOnOrBefore,
  isPastPartyForFof,
  OPORTUNIDADE_FUTURA_FOF1_MONTHS_BEFORE,
  OPORTUNIDADE_FUTURA_FOF2_DELAY_DAYS,
  OPORTUNIDADE_FUTURA_FOF3_DAYS_BEFORE,
  OPORTUNIDADE_FUTURA_WHATSAPP_BINDING_KEY,
  shouldResetFofCycle,
};

export const OPORTUNIDADE_FUTURA_FOF1_TEMPLATE = "follow-up-oportunidade-futura-fof1";

export const OPORTUNIDADE_FUTURA_FOF2_TEMPLATE = "follow-up-oportunidade-futura-fof2";

export const OPORTUNIDADE_FUTURA_FOF3_TEMPLATE = "follow-up-oportunidade-futura-fof3";

export const OPORTUNIDADE_FUTURA_FOF1_EVENT = "oportunidade_futura.fof1";

export const OPORTUNIDADE_FUTURA_FOF2_EVENT = "oportunidade_futura.fof2";

export const OPORTUNIDADE_FUTURA_FOF3_EVENT = "oportunidade_futura.fof3";

export type OportunidadeFuturaFofStep = 1 | 2 | 3;

export const oportunidadeFuturaFofStepToTemplateKey = (step: OportunidadeFuturaFofStep): string => {
  if (step === 1) return OPORTUNIDADE_FUTURA_FOF1_TEMPLATE;
  if (step === 2) return OPORTUNIDADE_FUTURA_FOF2_TEMPLATE;
  return OPORTUNIDADE_FUTURA_FOF3_TEMPLATE;
};

export const oportunidadeFuturaFofStepToEvent = (step: OportunidadeFuturaFofStep): string => {
  if (step === 1) return OPORTUNIDADE_FUTURA_FOF1_EVENT;
  if (step === 2) return OPORTUNIDADE_FUTURA_FOF2_EVENT;
  return OPORTUNIDADE_FUTURA_FOF3_EVENT;
};
