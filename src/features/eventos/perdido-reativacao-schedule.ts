import { parseIsoDateLocal } from "@/lib/date";

const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export const PERDIDO_REATIVACAO_FOP1_MONTHS_BEFORE = 6;

export const PERDIDO_REATIVACAO_FOP2_DELAY_DAYS = 30;

export const PERDIDO_REATIVACAO_FOP3_DAYS_BEFORE = 90;

export const toIsoDateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export const isIsoDateOnly = (value: string): boolean => ISO_DATE_ONLY.test(value.trim());

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

/** Festa já aconteceu — elegível para reativação do ano seguinte. */
export const isPastPartyForReativacao = (dataEvento: string, todayIso: string): boolean =>
  isIsoDateBefore(dataEvento, todayIso);

/**
 * Próxima ocorrência da festa (mesmo dia/mês) a partir de hoje.
 * Ex.: festa 2025-07-15, hoje 2026-03-01 → 2026-07-15; hoje 2026-08-01 → 2027-07-15.
 */
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

/** 6 meses antes do mês da festa alvo (1º dia desse mês). */
export const getFop1TriggerDate = (targetPartyDateIso: string): string | null => {
  const parsed = parseIsoDateLocal(targetPartyDateIso);
  if (!parsed) return null;

  const trigger = new Date(parsed.getFullYear(), parsed.getMonth() - PERDIDO_REATIVACAO_FOP1_MONTHS_BEFORE, 1, 12, 0, 0, 0);
  return toIsoDateKey(trigger);
};

/** 90 dias antes da data alvo da festa. */
export const getFop3TriggerDate = (targetPartyDateIso: string): string | null => {
  const parsed = parseIsoDateLocal(targetPartyDateIso);
  if (!parsed) return null;

  parsed.setDate(parsed.getDate() - PERDIDO_REATIVACAO_FOP3_DAYS_BEFORE);
  return toIsoDateKey(parsed);
};

/** 30 dias após o envio do FOP1 (data no fuso de Brasília). */
export const getFop2TriggerDate = (fop1EnviadoEm: string): string | null => {
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" });
  const sentDay = formatter.format(new Date(fop1EnviadoEm));
  const parsed = parseIsoDateLocal(sentDay);
  if (!parsed) return null;

  parsed.setDate(parsed.getDate() + PERDIDO_REATIVACAO_FOP2_DELAY_DAYS);
  return toIsoDateKey(parsed);
};

/** Após FOP3 sem resposta, reinicia o ciclo no FOP1 do ano seguinte. */
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
