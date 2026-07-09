import { Evento } from "@/features/eventos";

import { FinanceiroLancamento } from "./types";

export const sumLancamentosByTipo = (
  lancamentos: Pick<FinanceiroLancamento, "tipo" | "valor">[],
  tipo: FinanceiroLancamento["tipo"],
) => lancamentos.filter((item) => item.tipo === tipo).reduce((sum, item) => sum + item.valor, 0);

export const sumDescontos = (
  lancamentos: Pick<FinanceiroLancamento, "categoria" | "tipo" | "valor">[],
) =>
  lancamentos
    .filter((item) => item.tipo === "entrada" && item.categoria === "desconto")
    .reduce((sum, item) => sum + item.valor, 0);

export const sumEntradasAdicionais = (
  lancamentos: Pick<FinanceiroLancamento, "categoria" | "origem" | "tipo" | "valor">[],
) =>
  lancamentos
    .filter(
      (item) =>
        item.tipo === "entrada" &&
        (item.origem === "upsell" ||
          (item.origem === "manual" &&
            item.categoria !== "pagamento_contrato" &&
            item.categoria !== "desconto")),
    )
    .reduce((sum, item) => sum + item.valor, 0);

/** @deprecated Use sumEntradasAdicionais */
export const sumUpsellEntradas = sumEntradasAdicionais;

export const computeEventRevenueTotal = (
  event: Pick<Evento, "valor_total">,
  upsellTotal: number,
) => Number(event.valor_total || 0) + upsellTotal;

export const computeEventReceivableTotal = (
  event: Pick<Evento, "valor_total">,
  lancamentos: Pick<FinanceiroLancamento, "categoria" | "origem" | "tipo" | "valor">[],
) => {
  const adicionaisTotal = sumEntradasAdicionais(lancamentos);
  const descontoTotal = sumDescontos(lancamentos);

  return {
    adicionaisTotal,
    descontoTotal,
    receivableTotal: computeEventRevenueTotal(event, adicionaisTotal) + descontoTotal,
  };
};

export const computeEventResult = (entradaTotal: number, saidaTotal: number) => entradaTotal - saidaTotal;

export const computeEventMarginPercent = (entradaTotal: number, resultado: number) => {
  if (entradaTotal <= 0) {
    return null;
  }

  return (resultado / entradaTotal) * 100;
};

export const buildEventoFinanceiroSummary = (
  event: Pick<Evento, "valor_total">,
  lancamentos: Pick<FinanceiroLancamento, "categoria" | "origem" | "tipo" | "valor">[],
) => {
  const { adicionaisTotal, descontoTotal, receivableTotal } = computeEventReceivableTotal(event, lancamentos);
  const saidaTotal = sumLancamentosByTipo(lancamentos, "saida");
  const resultadoFesta = computeEventResult(receivableTotal, saidaTotal);
  const margemPercent = computeEventMarginPercent(receivableTotal, resultadoFesta);

  return {
    descontoTotal,
    entradaTotal: receivableTotal,
    margemPercent,
    resultadoFesta,
    saidaTotal,
    upsellTotal: adicionaisTotal,
  };
};

export const buildTenantFinanceiroPeriodSummary = (
  lancamentos: Pick<FinanceiroLancamento, "tipo" | "valor">[],
) => {
  const entradas = sumLancamentosByTipo(lancamentos, "entrada");
  const saidas = sumLancamentosByTipo(lancamentos, "saida");

  return {
    entradas,
    resultado: entradas - saidas,
    saidas,
  };
};
