export const POST_PARTY_AUTOMATION_EFFECTIVE_DATE = "2026-07-05";

export const getBrazilTodayIsoDate = (now = new Date()): string =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

export const isPostPartyAutomationActive = (
  todayIso = getBrazilTodayIsoDate(),
): boolean => todayIso >= POST_PARTY_AUTOMATION_EFFECTIVE_DATE;

export const shouldTransitionToAguardandoFeedback = (
  partyDateIso: string,
  todayIso = getBrazilTodayIsoDate(),
): boolean => {
  const partyDate = partyDateIso.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(partyDate)) return false;
  if (!isPostPartyAutomationActive(todayIso)) return false;
  return todayIso > partyDate;
};
