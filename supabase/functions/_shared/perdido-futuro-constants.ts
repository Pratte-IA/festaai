export const PERDIDO_FUTURO_FUP1_DAYS_BEFORE = 60;

export const PERDIDO_FUTURO_FUP1_TEMPLATE_DATA_LIVRE = "follow-up-perdido-futuro-fup1-data-livre";

export const PERDIDO_FUTURO_FUP1_TEMPLATE_DATA_INDISPONIVEL =
  "follow-up-perdido-futuro-fup1-data-indisponivel";

export const PERDIDO_FUTURO_FUP1_EVENT = "perdido_futuro.fup1";

export type PerdidoFuturoFup1Variante = "data_livre" | "data_indisponivel";

export const perdidoFuturoFup1VarianteToTemplateKey = (
  variante: PerdidoFuturoFup1Variante,
): string =>
  variante === "data_livre"
    ? PERDIDO_FUTURO_FUP1_TEMPLATE_DATA_LIVRE
    : PERDIDO_FUTURO_FUP1_TEMPLATE_DATA_INDISPONIVEL;

const ISO_DATE_PREFIX = /^(\d{4})-(\d{2})-(\d{2})/;
const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

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

export const isFuturePartyForPerdidoFollowup = (dataEvento: string, todayIso: string): boolean =>
  !isPastPartyForReativacao(dataEvento, todayIso);

export const getFup1TriggerDate = (dataEvento: string): string | null => {
  const parsed = parseIsoDateLocal(dataEvento);
  if (!parsed) return null;

  parsed.setDate(parsed.getDate() - PERDIDO_FUTURO_FUP1_DAYS_BEFORE);
  return toIsoDateKey(parsed);
};

export const isEligibleForFup1Dispatch = (input: {
  dataEvento: string;
  fup1EnviadoEm: string | null;
  todayIso: string;
}): boolean => {
  if (input.fup1EnviadoEm) return false;
  if (!isFuturePartyForPerdidoFollowup(input.dataEvento, input.todayIso)) return false;

  const trigger = getFup1TriggerDate(input.dataEvento);
  if (!trigger) return false;

  if (!isIsoDateBefore(input.todayIso, input.dataEvento)) return false;

  return isIsoDateOnOrBefore(trigger, input.todayIso);
};
