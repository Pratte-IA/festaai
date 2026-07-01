import { Evento, EventoPagamento } from "@/features/eventos";

export interface MonthRange {
  endDate: string;
  endIso: string;
  startDate: string;
  startIso: string;
}

export interface MonthRevenueBreakdown {
  monthFestaEntradas: number;
  monthPaymentsReceived: number;
  monthRevenue: number;
}

const isTimestampInRange = (value: string, startIso: string, endIso: string) =>
  value >= startIso && value <= endIso;

const isPaymentInMonth = (payment: EventoPagamento, startDate: string, endDate: string) =>
  payment.data_pagamento >= startDate && payment.data_pagamento <= endDate;

const isFestaEntradaEvent = (event: Evento) =>
  (event.funil === "festa" || event.funil === "executadas") && event.valor_entrada > 0;

/** Entrada de festa confirmada no mês (fechamento ou criação do evento). */
export const sumMonthFestaEntradas = (events: Evento[], range: MonthRange) =>
  events.reduce((sum, event) => {
    if (!isFestaEntradaEvent(event)) return sum;

    const referenceDate = event.fechamento_confirmado_em ?? event.created_at;
    if (!isTimestampInRange(referenceDate, range.startIso, range.endIso)) return sum;

    return sum + event.valor_entrada;
  }, 0);

export const sumMonthPaymentsReceived = (payments: EventoPagamento[], range: MonthRange) =>
  payments.reduce((sum, payment) => {
    if (!isPaymentInMonth(payment, range.startDate, range.endDate)) return sum;
    return sum + payment.valor;
  }, 0);

export const buildMonthRevenueBreakdown = (
  events: Evento[],
  payments: EventoPagamento[],
  range: MonthRange,
): MonthRevenueBreakdown => {
  const monthFestaEntradas = sumMonthFestaEntradas(events, range);
  const monthPaymentsReceived = sumMonthPaymentsReceived(payments, range);

  return {
    monthFestaEntradas,
    monthPaymentsReceived,
    monthRevenue: monthFestaEntradas + monthPaymentsReceived,
  };
};
