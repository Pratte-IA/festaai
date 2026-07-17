/**
 * Timing FOF = mesmo calendário da sequência FOP (6 meses / +30d / 90 dias).
 * Mantém aliases claros para a nomenclatura de Oportunidade Futura.
 */

export {
  PERDIDO_REATIVACAO_FOP1_MONTHS_BEFORE as OPORTUNIDADE_FUTURA_FOF1_MONTHS_BEFORE,
  PERDIDO_REATIVACAO_FOP2_DELAY_DAYS as OPORTUNIDADE_FUTURA_FOF2_DELAY_DAYS,
  PERDIDO_REATIVACAO_FOP3_DAYS_BEFORE as OPORTUNIDADE_FUTURA_FOF3_DAYS_BEFORE,
  addYearsToIsoDate,
  formatMesFestaBR,
  getFop1TriggerDate as getFof1TriggerDate,
  getFop2TriggerDate as getFof2TriggerDate,
  getFop3TriggerDate as getFof3TriggerDate,
  getReativacaoTargetPartyDate as getFofTargetPartyDate,
  isIsoDateOnOrBefore,
  isPastPartyForReativacao as isPastPartyForFof,
  shouldResetReativacaoCycle as shouldResetFofCycle,
} from "./perdido-reativacao-schedule";
