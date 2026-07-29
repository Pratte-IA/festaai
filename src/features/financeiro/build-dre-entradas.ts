import { FinanceiroContratoEntrada, FinanceiroDisplayItem, DrePeriodSummary } from "./display-types";
import {
  buildFluxoCaixaEntradasFestas,
  mapContratoEntradaToDisplay,
  mapLancamentoToFluxoDisplay,
} from "./fluxo-caixa";
import { FinanceiroLancamento } from "./types";

export { mapContratoEntradaToDisplay };

export const mapLancamentoToDisplay = mapLancamentoToFluxoDisplay;

/**
 * @deprecated Prefer buildFluxoCaixaEntradasFestas — inclui pagamentos do ledger + sinal legado.
 * Mantido para compatibilidade: só mapeia sinais legados.
 */
export const buildDreEntradas = (contratoEntradas: FinanceiroContratoEntrada[]): FinanceiroDisplayItem[] =>
  sortDisplayItems(contratoEntradas.map(mapContratoEntradaToDisplay));

const sortDisplayItems = (items: FinanceiroDisplayItem[]) =>
  [...items].sort(
    (a, b) => b.data_lancamento.localeCompare(a.data_lancamento) || b.id.localeCompare(a.id),
  );

/** Reservas/sinal legados (valor_entrada). */
export const buildEntradasFestasAutomaticas = buildDreEntradas;

/** Entradas de festa no Fluxo de Caixa (legado + ledger, sem duplicar sync). */
export const buildEntradasFestasFluxoCaixa = buildFluxoCaixaEntradasFestas;

/** Receitas avulsas da empresa (ex.: venda de estoque), sem vinculo com festa. */
export const buildEntradasManuaisGerais = (lancamentos: FinanceiroLancamento[]): FinanceiroDisplayItem[] =>
  sortDisplayItems(
    lancamentos
      .filter((item) => item.tipo === "entrada" && item.origem === "manual" && item.evento_id == null)
      .map(mapLancamentoToDisplay),
  );

export const buildDreSaidas = (lancamentos: FinanceiroLancamento[]): FinanceiroDisplayItem[] =>
  sortDisplayItems(lancamentos.filter((item) => item.tipo === "saida").map(mapLancamentoToDisplay));

/** Despesas gerais do tenant (aluguel, marketing, investimentos etc.). */
export const buildSaidasGerais = (lancamentos: FinanceiroLancamento[]): FinanceiroDisplayItem[] =>
  sortDisplayItems(
    lancamentos
      .filter((item) => item.tipo === "saida" && item.evento_id == null)
      .map(mapLancamentoToDisplay),
  );

/** Despesas lancadas no financeiro de cada festa. */
export const buildSaidasFestas = (lancamentos: FinanceiroLancamento[]): FinanceiroDisplayItem[] =>
  sortDisplayItems(
    lancamentos
      .filter((item) => item.tipo === "saida" && item.evento_id != null)
      .map(mapLancamentoToDisplay),
  );

export const sumDisplayItems = (items: Pick<FinanceiroDisplayItem, "valor">[]) =>
  items.reduce((sum, item) => sum + item.valor, 0);

export const buildDrePeriodSummary = (
  entradas: FinanceiroDisplayItem[],
  saidas: FinanceiroDisplayItem[],
): DrePeriodSummary => {
  const entradasTotal = sumDisplayItems(entradas);
  const saidasTotal = sumDisplayItems(saidas);

  return {
    entradas: entradasTotal,
    resultado: entradasTotal - saidasTotal,
    saidas: saidasTotal,
  };
};
