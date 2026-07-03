const ISO_DATE_PREFIX = /^(\d{4})-(\d{2})-(\d{2})/;
const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const DAY_MS = 1000 * 60 * 60 * 24;

export const isIsoDateOnly = (value: string): boolean => ISO_DATE_ONLY.test(value.trim());

const toIsoDateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export const toLocalIsoDateKey = toIsoDateKey;

/** YYYY-MM-DD do dia atual no fuso local (sem conversão UTC). */
export const getTodayIsoDate = (): string => toIsoDateKey(getTodayAtNoon());

/** Interpreta YYYY-MM-DD no fuso local, sem deslocamento de dia. */
export const parseIsoDateLocal = (value: string): Date | null => {
  const match = ISO_DATE_PREFIX.exec(value.trim());
  if (!match) return null;

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
};

/** Formata YYYY-MM-DD para DD/MM/YYYY sem conversão de fuso horário. */
export const formatIsoDateBR = (value: string | null | undefined): string => {
  if (!value) return "Nao informado";

  const match = ISO_DATE_PREFIX.exec(value.trim());
  if (!match) return "Nao informado";

  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
};

/** Formata instante ISO (com hora) para DD/MM/YYYY no fuso local. */
export const formatTimestampDateBR = (value: string | null | undefined): string => {
  if (!value) return "Nao informado";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Nao informado";

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const getTodayAtNoon = (): Date => {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return today;
};

/**
 * Formata valor de data para exibição pt-BR.
 * Campos date-only (YYYY-MM-DD) usam parsing literal; timestamps usam fuso local.
 */
export const formatDateBR = (value: string | null | undefined, fallback = "Nao informado"): string => {
  if (!value) return fallback;

  const trimmed = value.trim();
  if (isIsoDateOnly(trimmed)) {
    return formatIsoDateBR(trimmed);
  }

  return formatTimestampDateBR(trimmed);
};

/** Diferença em dias entre uma data ISO (YYYY-MM-DD) e hoje (fuso local). */
export const compareIsoDateToToday = (isoDate: string): number | null => {
  const date = parseIsoDateLocal(isoDate);
  if (!date) return null;

  const today = getTodayAtNoon();
  return Math.round((date.getTime() - today.getTime()) / DAY_MS);
};

export const isIsoDateBeforeToday = (isoDate: string): boolean => {
  const diff = compareIsoDateToToday(isoDate);
  return diff !== null && diff < 0;
};
