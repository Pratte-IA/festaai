import { Evento } from "./types";

/** Festas no funil executadas são consideradas quitadas, independente dos pagamentos registrados. */
export const isEventFullySettled = (event: Pick<Evento, "funil">) => event.funil === "executadas";

export const getEventRecordedPaid = (
  event: Pick<Evento, "valor_entrada">,
  additionalPayments = 0,
) => event.valor_entrada + additionalPayments;

export const getEventDisplayTotalPaid = (
  event: Pick<Evento, "funil" | "valor_total" | "valor_entrada">,
  additionalPayments = 0,
) => (isEventFullySettled(event) ? event.valor_total : getEventRecordedPaid(event, additionalPayments));

export const getEventBalance = (
  event: Pick<Evento, "funil" | "valor_total" | "valor_entrada">,
  additionalPayments = 0,
) =>
  isEventFullySettled(event)
    ? 0
    : Math.max(event.valor_total - getEventRecordedPaid(event, additionalPayments), 0);

/** Saldo devedor do formulário de fechamento: total menos entrada (campo derivado). */
export const computeClosingFormValorSaldo = (valorTotal: number, valorEntrada: number) =>
  Math.max(Number(valorTotal || 0) - Number(valorEntrada || 0), 0);
