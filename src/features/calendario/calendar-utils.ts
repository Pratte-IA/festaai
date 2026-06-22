import {
  Evento,
  isCalendarVisitaEvento,
  isScheduledPartyEvento,
} from "@/features/eventos";

import { CalendarBlock, DateStatus, DayInfo } from "./types";

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export const formatDateBR = (dateStr: string): string => {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
};

export const formatDateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export const getMonthRange = (year: number, month: number) => {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);

  return {
    end: formatDateKey(endDate),
    start: formatDateKey(startDate),
  };
};

export const buildMonthDays = (
  year: number,
  month: number,
  events: Evento[],
  blocks: CalendarBlock[],
): DayInfo[] => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const blocksByDate = new Map(blocks.map((block) => [block.data, block]));

  return Array.from({ length: daysInMonth }, (_, index) => {
    const date = formatDateKey(new Date(year, month, index + 1));
    const dateObj = new Date(`${date}T12:00:00`);
    const eventsOnDate = events.filter((event) => event.data_evento === date);
    const festas = eventsOnDate.filter(isScheduledPartyEvento);
    const visitas = eventsOnDate.filter(isCalendarVisitaEvento);
    const block = blocksByDate.get(date);

    let status: DateStatus = "disponivel";
    if (block) {
      status = "bloqueado";
    } else if (festas.length > 0) {
      status = "reservado";
    }

    return {
      blockedManually: Boolean(block),
      blockId: block?.id ?? null,
      date,
      dayOfWeek: DAY_NAMES[dateObj.getDay()],
      dayOfWeekIndex: dateObj.getDay(),
      events: [...festas, ...visitas],
      festas,
      status,
      visitas,
    };
  });
};
