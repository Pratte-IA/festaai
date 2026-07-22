import { Evento, getEventBalance } from "@/features/eventos";
import { toLocalIsoDateKey } from "@/lib/date";

import { isReceivableOverdue } from "./receivable-due-window";

export const getEventOpenBalance = (event: Evento, paidByEvent: Map<number, number>) =>
  getEventBalance(event, paidByEvent.get(event.id) ?? 0);

export const isFestaWithOpenBalance = (event: Evento, paidByEvent: Map<number, number>) =>
  event.funil === "festa" && getEventOpenBalance(event, paidByEvent) > 0;

export const sumFestaOpenBalance = (events: Evento[], paidByEvent: Map<number, number>) =>
  events.reduce((sum, event) => {
    if (!isFestaWithOpenBalance(event, paidByEvent)) return sum;
    return sum + getEventOpenBalance(event, paidByEvent);
  }, 0);

/**
 * Soma saldos com vencimento já passado (data_limite_pagamento ou
 * data_evento − 7 dias) — mesma regra do card "Valores a receber".
 */
export const sumFestaOverdueOpenBalance = (
  events: Evento[],
  paidByEvent: Map<number, number>,
  referenceDate = new Date(),
) => {
  const todayIso = toLocalIsoDateKey(referenceDate);

  return events.reduce((sum, event) => {
    if (!isFestaWithOpenBalance(event, paidByEvent)) return sum;
    if (!isReceivableOverdue(event, todayIso)) return sum;
    return sum + getEventOpenBalance(event, paidByEvent);
  }, 0);
};
