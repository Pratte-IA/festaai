import {
  Evento,
  EventoPagamento,
  getEventRecordedPaid,
  isEventFullySettled,
} from "@/features/eventos";

import { isDateInPeriod } from "./report-utils";
import { ReportPeriod } from "./types";

export type FinancialEntryType = "entrada" | "pagamento" | "quitacao";

export interface FinancialEntry {
  id: string;
  date: string;
  type: FinancialEntryType;
  cliente: string;
  dataEvento: string | null;
  valor: number;
  metodo: string | null;
  observacao: string | null;
  eventoId: number;
}

interface BuildHistoricoFinanceiroEntriesInput {
  eventos: Evento[];
  pagamentos: EventoPagamento[];
  paidByEventoId: Map<number, number>;
  period: ReportPeriod;
}

const getEntradaReferenceDate = (event: Evento) =>
  (event.fechamento_confirmado_em ?? event.created_at).slice(0, 10);

export const buildHistoricoFinanceiroEntries = ({
  eventos,
  pagamentos,
  paidByEventoId,
  period,
}: BuildHistoricoFinanceiroEntriesInput): FinancialEntry[] => {
  const eventById = new Map(eventos.map((event) => [event.id, event]));
  const pagamentosByEventoId = new Map<number, EventoPagamento[]>();

  pagamentos.forEach((payment) => {
    const current = pagamentosByEventoId.get(payment.evento_id) ?? [];
    current.push(payment);
    pagamentosByEventoId.set(payment.evento_id, current);
  });

  const result: FinancialEntry[] = [];
  const processedEventIds = new Set<number>();

  for (const event of eventos) {
    if (!isEventFullySettled(event)) continue;
    if (!event.data_evento || !isDateInPeriod(event.data_evento, period)) continue;
    if (event.valor_total <= 0) continue;

    processedEventIds.add(event.id);

    if (event.valor_entrada > 0) {
      result.push({
        id: `entrada-${event.id}`,
        date: getEntradaReferenceDate(event),
        type: "entrada",
        cliente: event.cliente_nome,
        dataEvento: event.data_evento,
        valor: event.valor_entrada,
        metodo: event.forma_pagamento_entrada,
        observacao: null,
        eventoId: event.id,
      });
    }

    for (const payment of pagamentosByEventoId.get(event.id) ?? []) {
      result.push({
        id: `pagamento-${payment.id}`,
        date: payment.data_pagamento,
        type: "pagamento",
        cliente: event.cliente_nome,
        dataEvento: event.data_evento,
        valor: payment.valor,
        metodo: payment.metodo,
        observacao: payment.observacao,
        eventoId: event.id,
      });
    }

    const additionalPayments = paidByEventoId.get(event.id) ?? 0;
    const recordedPaid = getEventRecordedPaid(event, additionalPayments);
    const remainder = event.valor_total - recordedPaid;

    if (remainder > 0) {
      result.push({
        id: `quitacao-${event.id}`,
        date: event.data_evento,
        type: "quitacao",
        cliente: event.cliente_nome,
        dataEvento: event.data_evento,
        valor: remainder,
        metodo: null,
        observacao: "Quitação — festa executada",
        eventoId: event.id,
      });
    }
  }

  for (const event of eventos) {
    if (processedEventIds.has(event.id) || isEventFullySettled(event)) continue;
    if (event.valor_entrada <= 0) continue;

    const referenceDate = getEntradaReferenceDate(event);
    if (!isDateInPeriod(referenceDate, period)) continue;

    result.push({
      id: `entrada-${event.id}`,
      date: referenceDate,
      type: "entrada",
      cliente: event.cliente_nome,
      dataEvento: event.data_evento,
      valor: event.valor_entrada,
      metodo: event.forma_pagamento_entrada,
      observacao: null,
      eventoId: event.id,
    });
  }

  for (const payment of pagamentos) {
    if (processedEventIds.has(payment.evento_id)) continue;
    if (!isDateInPeriod(payment.data_pagamento, period)) continue;

    const event = eventById.get(payment.evento_id);

    result.push({
      id: `pagamento-${payment.id}`,
      date: payment.data_pagamento,
      type: "pagamento",
      cliente: event?.cliente_nome ?? "—",
      dataEvento: event?.data_evento ?? null,
      valor: payment.valor,
      metodo: payment.metodo,
      observacao: payment.observacao,
      eventoId: payment.evento_id,
    });
  }

  return result.sort((a, b) => b.date.localeCompare(a.date) || b.valor - a.valor);
};
