const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export const parseIsoDateString = (
  dateStr: string,
): { year: number; month: number; day: number } | null => {
  const match = ISO_DATE_PATTERN.exec(dateStr.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  return { year, month, day };
};

export const formatIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/** Algoritmo de Meeus/Jones/Butcher para o domingo de Páscoa. */
export const calculateEasterSunday = (year: number): Date => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month - 1, day, 12, 0, 0, 0);
};

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const FIXED_NATIONAL_HOLIDAYS = new Set([
  "01-01",
  "04-21",
  "05-01",
  "09-07",
  "10-12",
  "11-02",
  "11-15",
  "11-20",
  "12-25",
]);

/** Feriados nacionais fixos e móveis usados na precificação por faixa de dia. */
export const isBrazilianNationalHoliday = (dateStr: string): boolean => {
  const parts = parseIsoDateString(dateStr);
  if (!parts) return false;

  const monthDay = `${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
  if (FIXED_NATIONAL_HOLIDAYS.has(monthDay)) return true;

  const easter = calculateEasterSunday(parts.year);
  const movableDates = new Set(
    [
      addDays(easter, -48),
      addDays(easter, -47),
      addDays(easter, -2),
      addDays(easter, 60),
    ].map(formatIsoDate),
  );

  return movableDates.has(dateStr);
};
