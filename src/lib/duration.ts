/** Formata minutos para exibição humana (ex.: 90 → "1h30", 120 → "2h", 45 → "45min"). */
export const formatDurationMinutes = (minutes: number | null | undefined): string => {
  if (minutes == null || minutes <= 0) return "";

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0 && mins > 0) return `${hours}h${mins}`;
  if (hours > 0) return `${hours}h`;
  return `${mins}min`;
};

/**
 * Converte texto livre em minutos.
 * Aceita: 1h30, 1h, 2 h 15, 45min, 45, 1:30
 */
export const parseDurationInput = (text: string): number | null => {
  const value = text.trim().toLowerCase();
  if (!value) return null;

  const hoursMinutesMatch = value.match(/^(\d+)\s*h\s*(\d+)?(?:\s*(?:min|m))?$/);
  if (hoursMinutesMatch) {
    const hours = Number(hoursMinutesMatch[1]);
    const mins = hoursMinutesMatch[2] ? Number(hoursMinutesMatch[2]) : 0;
    if (Number.isNaN(hours) || Number.isNaN(mins) || mins >= 60) return null;
    const total = hours * 60 + mins;
    return total > 0 ? total : null;
  }

  const colonMatch = value.match(/^(\d+)\s*:\s*(\d{1,2})$/);
  if (colonMatch) {
    const hours = Number(colonMatch[1]);
    const mins = Number(colonMatch[2]);
    if (Number.isNaN(hours) || Number.isNaN(mins) || mins >= 60) return null;
    const total = hours * 60 + mins;
    return total > 0 ? total : null;
  }

  const minutesOnlyMatch = value.match(/^(\d+)\s*(?:min|m)?$/);
  if (minutesOnlyMatch) {
    const mins = Number(minutesOnlyMatch[1]);
    if (Number.isNaN(mins) || mins <= 0) return null;
    return mins;
  }

  return null;
};
