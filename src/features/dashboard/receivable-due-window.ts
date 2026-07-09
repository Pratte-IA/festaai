import type { Evento } from "@/features/eventos";
import { getTodayIsoDate } from "@/lib/date";

import { addDaysToIsoDate } from "./sete-dias-preview";

const BALANCE_DUE_DAYS_BEFORE_EVENT = 7;

export const subtractDaysFromIsoDate = (isoDate: string, days: number): string =>
  addDaysToIsoDate(isoDate, -days);

export const getReceivableDueDate = (event: Evento): string | null => {
  if (event.data_limite_pagamento) return event.data_limite_pagamento;
  if (!event.data_evento) return null;

  return subtractDaysFromIsoDate(event.data_evento, BALANCE_DUE_DAYS_BEFORE_EVENT);
};

export const isReceivableOverdue = (event: Evento, todayIso = getTodayIsoDate()): boolean => {
  const dueDate = getReceivableDueDate(event);
  if (!dueDate) return false;

  return dueDate < todayIso;
};

/** Vencimentos desta semana ou saldos já em atraso. */
export const shouldShowInReceivablesCard = (
  event: Evento,
  weekStartDate: string,
  weekEndDate: string,
  todayIso = getTodayIsoDate(),
): boolean => {
  const dueDate = getReceivableDueDate(event);
  if (!dueDate) return false;

  if (dueDate < todayIso) return true;

  return dueDate >= weekStartDate && dueDate <= weekEndDate;
};

/** @deprecated Use shouldShowInReceivablesCard */
export const isReceivableDueInWeek = (
  event: Evento,
  weekStartDate: string,
  weekEndDate: string,
): boolean => shouldShowInReceivablesCard(event, weekStartDate, weekEndDate);
