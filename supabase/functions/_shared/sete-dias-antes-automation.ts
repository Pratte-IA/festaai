export const SETE_DIAS_AUTOMATION_EFFECTIVE_DATE = "2026-07-06";

export const getBrazilTodayIsoDate = (now = new Date()): string =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

export const addDaysToIsoDate = (isoDate: string, days: number): string => {
  const [year, month, day] = isoDate.split("-").map(Number);
  const utc = Date.UTC(year, month - 1, day + days);
  return new Date(utc).toISOString().slice(0, 10);
};

export const isSeteDiasAutomationActive = (
  todayIso = getBrazilTodayIsoDate(),
): boolean => todayIso >= SETE_DIAS_AUTOMATION_EFFECTIVE_DATE;

export const getTargetPartyDateForSeteDiasReminder = (
  todayIso = getBrazilTodayIsoDate(),
): string => addDaysToIsoDate(todayIso, 7);

export const shouldSendSeteDiasReminder = (
  partyDateIso: string,
  todayIso = getBrazilTodayIsoDate(),
): boolean => {
  const partyDate = partyDateIso.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(partyDate)) return false;
  if (!isSeteDiasAutomationActive(todayIso)) return false;
  return partyDate === getTargetPartyDateForSeteDiasReminder(todayIso);
};
