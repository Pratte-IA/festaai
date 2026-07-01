const ISO_DATE_PREFIX = /^(\d{4})-(\d{2})-(\d{2})/;

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
