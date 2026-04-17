import { mockEvents, Event } from "./mockEvents";

export type DateStatus = "disponivel" | "reservado" | "bloqueado";

export interface DayInfo {
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  dayOfWeekIndex: number; // 0=Dom, 6=Sáb
  status: DateStatus;
  events: Event[];
  festas: Event[];
  visitas: Event[];
  blockedManually: boolean;
}

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const manuallyBlockedDates: string[] = [
  "2026-04-20",
  "2026-05-01",
  "2026-05-17",
];

export function getManuallyBlockedDates(): string[] {
  return [...manuallyBlockedDates];
}

export function addBlockedDate(date: string) {
  if (!manuallyBlockedDates.includes(date)) {
    manuallyBlockedDates.push(date);
  }
}

export function removeBlockedDate(date: string) {
  const idx = manuallyBlockedDates.indexOf(date);
  if (idx !== -1) manuallyBlockedDates.splice(idx, 1);
}

export function getDayInfo(dateStr: string): DayInfo {
  const dateObj = new Date(dateStr + "T12:00:00");
  const dayOfWeekIndex = dateObj.getDay();
  const dayOfWeek = DAY_NAMES[dayOfWeekIndex];

  const eventsOnDate = mockEvents.filter((e) => e.partyDate === dateStr);
  const festas = eventsOnDate.filter((e) => e.eventType === "festa");
  const visitas = eventsOnDate.filter((e) => e.eventType === "visita");
  const blockedManually = manuallyBlockedDates.includes(dateStr);

  // Only festas block availability
  let status: DateStatus = "disponivel";
  if (blockedManually) {
    status = "bloqueado";
  } else if (festas.length > 0) {
    status = "reservado";
  }

  return {
    date: dateStr,
    dayOfWeek,
    dayOfWeekIndex,
    status,
    events: eventsOnDate,
    festas,
    visitas,
    blockedManually,
  };
}

export function getMonthDays(year: number, month: number): DayInfo[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: DayInfo[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    days.push(getDayInfo(dateStr));
  }
  return days;
}

export function formatDateBR(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}
