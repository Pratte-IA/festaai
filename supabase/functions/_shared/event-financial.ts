/** Saldo devedor do formulário de fechamento: total menos entrada (campo derivado). */
export const computeClosingFormValorSaldo = (valorTotal: number, valorEntrada: number) =>
  Math.max(Number(valorTotal || 0) - Number(valorEntrada || 0), 0);

/**
 * Helpers de cálculo financeiro do evento, espelhando a lógica do frontend
 * (src/features/eventos/event-financial.ts e src/features/financeiro/party-financial.ts).
 *
 * Motivo: a coluna `eventos.valor_saldo` pode ficar desatualizada em relação aos
 * pagamentos (`evento_pagamentos`) e ajustes (`financeiro_lancamentos`). Automações
 * que enviam saldo/valor pago ao cliente devem recomputar esses valores em tempo real
 * para não disparar mensagens com valores incorretos.
 */

interface EventoFinanceiroFields {
  funil?: unknown;
  valor_total?: unknown;
  valor_entrada?: unknown;
}

interface FinanceiroLancamentoLike {
  categoria?: unknown;
  origem?: unknown;
  tipo?: unknown;
  valor?: unknown;
}

const toNumber = (value: unknown) => Number(value ?? 0) || 0;

/** Festas no funil executadas são consideradas quitadas, independente dos pagamentos registrados. */
export const isEventFullySettled = (event: EventoFinanceiroFields) => event.funil === "executadas";

/** Soma de entradas adicionais (upsell / manual que não seja pagamento de contrato ou desconto). */
export const sumEntradasAdicionais = (lancamentos: FinanceiroLancamentoLike[]) =>
  lancamentos
    .filter(
      (item) =>
        item.tipo === "entrada" &&
        (item.origem === "upsell" ||
          (item.origem === "manual" &&
            item.categoria !== "pagamento_contrato" &&
            item.categoria !== "desconto")),
    )
    .reduce((sum, item) => sum + toNumber(item.valor), 0);

/** Soma de descontos aplicados (lançados como entrada com categoria desconto e valor negativo). */
export const sumDescontos = (lancamentos: FinanceiroLancamentoLike[]) =>
  lancamentos
    .filter((item) => item.tipo === "entrada" && item.categoria === "desconto")
    .reduce((sum, item) => sum + toNumber(item.valor), 0);

/** Total a receber do evento: valor total do contrato + adicionais + descontos (negativos). */
export const computeEventReceivableTotal = (
  event: EventoFinanceiroFields,
  lancamentos: FinanceiroLancamentoLike[],
) => toNumber(event.valor_total) + sumEntradasAdicionais(lancamentos) + sumDescontos(lancamentos);

/** Valor registrado como pago: entrada + pagamentos adicionais registrados. */
export const getEventRecordedPaid = (event: EventoFinanceiroFields, additionalPayments = 0) =>
  toNumber(event.valor_entrada) + additionalPayments;

/** Valor exibido como pago (festas executadas são consideradas totalmente pagas). */
export const getEventDisplayTotalPaid = (event: EventoFinanceiroFields, additionalPayments = 0) =>
  isEventFullySettled(event)
    ? toNumber(event.valor_total)
    : getEventRecordedPaid(event, additionalPayments);

/** Saldo devedor calculado a partir do total a receber, considerando pagamentos adicionais. */
export const getEventBalanceFromReceivable = (
  event: EventoFinanceiroFields,
  receivableTotal: number,
  additionalPayments = 0,
) =>
  isEventFullySettled(event)
    ? 0
    : Math.max(receivableTotal - getEventRecordedPaid(event, additionalPayments), 0);

export interface EventoFinanceiroValores {
  saldoAPagar: number;
  valorPago: number;
  valorTotal: number;
}

/** Soma o valor de pagamentos registrados (evento_pagamentos). */
export const sumPagamentos = (pagamentos: Array<{ valor?: unknown }>) =>
  pagamentos.reduce((sum, row) => sum + toNumber(row.valor), 0);

/**
 * Consolida os valores financeiros exibidos ao cliente, espelhando o EventoDetalhe:
 * valorTotal = total a receber (contrato + adicionais + descontos),
 * valorPago = entrada + pagamentos adicionais,
 * saldoAPagar = total a receber - valor pago.
 */
export const buildEventoFinanceiroValores = (
  event: EventoFinanceiroFields,
  pagamentos: Array<{ valor?: unknown }>,
  lancamentos: FinanceiroLancamentoLike[],
): EventoFinanceiroValores => {
  const additionalPayments = sumPagamentos(pagamentos);
  const receivableTotal = computeEventReceivableTotal(event, lancamentos);

  return {
    saldoAPagar: getEventBalanceFromReceivable(event, receivableTotal, additionalPayments),
    valorPago: getEventDisplayTotalPaid(event, additionalPayments),
    valorTotal: receivableTotal,
  };
};
