import { Evento } from "./types";

/** Festas no funil executadas (marcação operacional; não implica quitação financeira). */
export const isEventFullySettled = (event: Pick<Evento, "funil">) => event.funil === "executadas";

export const getEventRecordedPaid = (
  event: Pick<Evento, "valor_entrada">,
  additionalPayments = 0,
) => event.valor_entrada + additionalPayments;

/** Total pago exibido = entrada + pagamentos registrados (mesmo em executadas). */
export const getEventDisplayTotalPaid = (
  event: Pick<Evento, "valor_entrada">,
  additionalPayments = 0,
) => getEventRecordedPaid(event, additionalPayments);

export const getEventBalance = (
  event: Pick<Evento, "valor_total" | "valor_entrada">,
  additionalPayments = 0,
) => Math.max(event.valor_total - getEventRecordedPaid(event, additionalPayments), 0);

export const getEventBalanceFromReceivable = (
  event: Pick<Evento, "valor_entrada">,
  receivableTotal: number,
  additionalPayments = 0,
) => Math.max(receivableTotal - getEventRecordedPaid(event, additionalPayments), 0);

/** Saldo devedor do formulário de fechamento: total menos entrada (campo derivado). */
export const computeClosingFormValorSaldo = (valorTotal: number, valorEntrada: number) =>
  Math.max(Number(valorTotal || 0) - Number(valorEntrada || 0), 0);

export const getEventoEntradaReferenceDate = (
  event: Pick<Evento, "fechamento_confirmado_em" | "created_at">,
) => (event.fechamento_confirmado_em ?? event.created_at).slice(0, 10);

export const getEventoEntradaDescricao = (
  event: Pick<Evento, "forma_pagamento_entrada">,
) => {
  const metodo = event.forma_pagamento_entrada?.trim();
  return metodo ? `Entrada · ${metodo}` : "Entrada";
};
