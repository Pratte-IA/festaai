const ISO_DATE_PREFIX = /^(\d{4})-(\d{2})-(\d{2})/;
const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export const PERDIDO_REATIVACAO_FOP1_MONTHS_BEFORE = 6;

export const PERDIDO_REATIVACAO_FOP2_DELAY_DAYS = 30;

export const PERDIDO_REATIVACAO_FOP3_DAYS_BEFORE = 90;

export const PERDIDO_REATIVACAO_TIMEZONE = "America/Sao_Paulo";

export const PERDIDO_REATIVACAO_TEMPLATE_KEY = "follow-up-perdido-reativacao";

export const PERDIDO_REATIVACAO_FOP1_TEMPLATE = "follow-up-perdido-reativacao-fop1";

export const PERDIDO_REATIVACAO_FOP2_TEMPLATE = "follow-up-perdido-reativacao-fop2";

export const PERDIDO_REATIVACAO_FOP3_TEMPLATE = "follow-up-perdido-reativacao-fop3";

export const PERDIDO_REATIVACAO_FOP1_EVENT = "perdido_reativacao.fop1";

export const PERDIDO_REATIVACAO_FOP2_EVENT = "perdido_reativacao.fop2";

export const PERDIDO_REATIVACAO_FOP3_EVENT = "perdido_reativacao.fop3";

export type PerdidoReativacaoFopStep = 1 | 2 | 3;

export const perdidoReativacaoFopStepToTemplateKey = (step: PerdidoReativacaoFopStep): string => {
  if (step === 1) return PERDIDO_REATIVACAO_FOP1_TEMPLATE;
  if (step === 2) return PERDIDO_REATIVACAO_FOP2_TEMPLATE;
  return PERDIDO_REATIVACAO_FOP3_TEMPLATE;
};

export const perdidoReativacaoFopStepToEvent = (step: PerdidoReativacaoFopStep): string => {
  if (step === 1) return PERDIDO_REATIVACAO_FOP1_EVENT;
  if (step === 2) return PERDIDO_REATIVACAO_FOP2_EVENT;
  return PERDIDO_REATIVACAO_FOP3_EVENT;
};

export const getBrazilTodayIsoDate = (now = new Date()): string => {
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: PERDIDO_REATIVACAO_TIMEZONE });
  return formatter.format(now);
};

const parseIsoDateLocal = (value: string): Date | null => {
  const match = ISO_DATE_PREFIX.exec(value.trim());
  if (!match) return null;

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const toIsoDateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const isIsoDateOnly = (value: string): boolean => ISO_DATE_ONLY.test(value.trim());

export const compareIsoDates = (leftIso: string, rightIso: string): number | null => {
  if (!isIsoDateOnly(leftIso) || !isIsoDateOnly(rightIso)) return null;

  const left = parseIsoDateLocal(leftIso);
  const right = parseIsoDateLocal(rightIso);
  if (!left || !right) return null;

  return left.getTime() - right.getTime();
};

export const isIsoDateOnOrBefore = (leftIso: string, rightIso: string): boolean => {
  const diff = compareIsoDates(leftIso, rightIso);
  return diff !== null && diff <= 0;
};

export const isIsoDateBefore = (leftIso: string, rightIso: string): boolean => {
  const diff = compareIsoDates(leftIso, rightIso);
  return diff !== null && diff < 0;
};

export const isPastPartyForReativacao = (dataEvento: string, todayIso: string): boolean =>
  isIsoDateBefore(dataEvento, todayIso);

export const getReativacaoTargetPartyDate = (
  dataEvento: string,
  todayIso: string,
): string | null => {
  const original = parseIsoDateLocal(dataEvento);
  const today = parseIsoDateLocal(todayIso);
  if (!original || !today) return null;

  let year = today.getFullYear();
  const target = new Date(year, original.getMonth(), original.getDate(), 12, 0, 0, 0);

  if (target.getTime() <= today.getTime()) {
    year += 1;
    target.setFullYear(year);
  }

  return toIsoDateKey(target);
};

export const addYearsToIsoDate = (isoDate: string, years: number): string | null => {
  const parsed = parseIsoDateLocal(isoDate);
  if (!parsed) return null;

  parsed.setFullYear(parsed.getFullYear() + years);
  return toIsoDateKey(parsed);
};

export const getFop1TriggerDate = (targetPartyDateIso: string): string | null => {
  const parsed = parseIsoDateLocal(targetPartyDateIso);
  if (!parsed) return null;

  const trigger = new Date(
    parsed.getFullYear(),
    parsed.getMonth() - PERDIDO_REATIVACAO_FOP1_MONTHS_BEFORE,
    1,
    12,
    0,
    0,
    0,
  );
  return toIsoDateKey(trigger);
};

export const getFop3TriggerDate = (targetPartyDateIso: string): string | null => {
  const parsed = parseIsoDateLocal(targetPartyDateIso);
  if (!parsed) return null;

  parsed.setDate(parsed.getDate() - PERDIDO_REATIVACAO_FOP3_DAYS_BEFORE);
  return toIsoDateKey(parsed);
};

export const getFop2TriggerDate = (fop1EnviadoEm: string): string | null => {
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: PERDIDO_REATIVACAO_TIMEZONE });
  const sentDay = formatter.format(new Date(fop1EnviadoEm));
  const parsed = parseIsoDateLocal(sentDay);
  if (!parsed) return null;

  parsed.setDate(parsed.getDate() + PERDIDO_REATIVACAO_FOP2_DELAY_DAYS);
  return toIsoDateKey(parsed);
};

export const shouldResetReativacaoCycle = (input: {
  fop3EnviadoEm: string | null;
  reativacaoFestaAlvo: string;
  todayIso: string;
}): boolean => {
  if (!input.fop3EnviadoEm) return false;

  const nextCycleTarget = addYearsToIsoDate(input.reativacaoFestaAlvo, 1);
  if (!nextCycleTarget) return false;

  const nextFop1Trigger = getFop1TriggerDate(nextCycleTarget);
  if (!nextFop1Trigger) return false;

  return isIsoDateOnOrBefore(nextFop1Trigger, input.todayIso);
};

export const formatMesFestaBR = (targetPartyDateIso: string): string => {
  const parsed = parseIsoDateLocal(targetPartyDateIso);
  if (!parsed) return "breve";

  const month = parsed.toLocaleDateString("pt-BR", { month: "long" });
  return month.charAt(0).toLowerCase() + month.slice(1);
};
