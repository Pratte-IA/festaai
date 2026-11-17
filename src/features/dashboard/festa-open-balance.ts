import { Evento, getEventBalanceFromReceivable, getEventRecordedPaid } from "@/features/eventos";
import { computeEventReceivableTotal } from "@/features/financeiro/party-financial";
import type { FinanceiroLancamento } from "@/features/financeiro/types";
import { toLocalIsoDateKey } from "@/lib/date";

import { isReceivableOverdue } from "./receivable-due-window";

/** Festas ativas com possível saldo em aberto (inclui executadas com pagamento parcial). */
export const isOpenBalanceEligibleEvent = (
  event: Evento,
  paidByEvent: Map<number, number> = new Map(),
) => {
  if (event.tipo_evento !== "festa" || event.status_interno === "cancelado") {
    return false;
  }

  if (event.funil === "festa") {
    return true;
  }

  // Executadas legadas sem nenhum pagamento registrado eram tratadas como quitadas.
  // Só reabre saldo no dashboard quando há entrada/parcelas parciais.
  if (event.funil === "executadas") {
    return getEventRecordedPaid(event, paidByEvent.get(event.id) ?? 0) > 0;
  }

  return false;
};

export const buildReceivableByEventMap = (
  events: Pick<Evento, "id" | "valor_total">[],
  lancamentos: Pick<FinanceiroLancamento, "categoria" | "evento_id" | "origem" | "tipo" | "valor">[],
) => {
  const byEvent = new Map<number, Pick<FinanceiroLancamento, "categoria" | "origem" | "tipo" | "valor">[]>();

  for (const item of lancamentos) {
    if (item.evento_id == null) continue;
    const current = byEvent.get(item.evento_id) ?? [];
    current.push(item);
    byEvent.set(item.evento_id, current);
  }

  const receivableByEvent = new Map<number, number>();
  for (const event of events) {
    const { receivableTotal } = computeEventReceivableTotal(event, byEvent.get(event.id) ?? []);
    receivableByEvent.set(event.id, receivableTotal);
  }

  return receivableByEvent;
};

/** Saldo em aberto do dashboard: funil festa ou executadas com pagamentos incompletos. */
export const getEventOpenBalance = (
  event: Evento,
  paidByEvent: Map<number, number>,
  receivableByEvent?: Map<number, number>,
) => {
  if (!isOpenBalanceEligibleEvent(event, paidByEvent)) return 0;

  const receivableTotal = receivableByEvent?.get(event.id) ?? event.valor_total;
  return getEventBalanceFromReceivable(event, receivableTotal, paidByEvent.get(event.id) ?? 0);
};

export const isFestaWithOpenBalance = (
  event: Evento,
  paidByEvent: Map<number, number>,
  receivableByEvent?: Map<number, number>,
) => getEventOpenBalance(event, paidByEvent, receivableByEvent) > 0;

export const sumFestaOpenBalance = (
  events: Evento[],
  paidByEvent: Map<number, number>,
  receivableByEvent?: Map<number, number>,
) =>
  events.reduce((sum, event) => {
    if (!isFestaWithOpenBalance(event, paidByEvent, receivableByEvent)) return sum;
    return sum + getEventOpenBalance(event, paidByEvent, receivableByEvent);
  }, 0);

/**
 * Soma saldos com vencimento já passado (data_limite_pagamento ou
 * data_evento − 7 dias) — mesma regra do card "Valores a receber".
 */
export const sumFestaOverdueOpenBalance = (
  events: Evento[],
  paidByEvent: Map<number, number>,
  referenceDate = new Date(),
  receivableByEvent?: Map<number, number>,
) => {
  const todayIso = toLocalIsoDateKey(referenceDate);

  return events.reduce((sum, event) => {
    if (!isFestaWithOpenBalance(event, paidByEvent, receivableByEvent)) return sum;
    if (!isReceivableOverdue(event, todayIso)) return sum;
    return sum + getEventOpenBalance(event, paidByEvent, receivableByEvent);
  }, 0);
};
