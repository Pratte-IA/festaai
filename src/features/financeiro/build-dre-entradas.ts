import { FinanceiroContratoEntrada, FinanceiroDisplayItem, DrePeriodSummary } from "./display-types";
import { FinanceiroLancamento } from "./types";

const toIsoDate = (value: string) => value.slice(0, 10);

export const mapContratoEntradaToDisplay = (item: FinanceiroContratoEntrada): FinanceiroDisplayItem => ({
  categoria: "entrada_contrato",
  data_lancamento: toIsoDate(item.acceptedAt),
  deletable: false,
  descricao: item.clienteNome,
  evento_id: item.eventoId,
  id: `contrato-${item.id}`,
  origem: "contrato",
  tipo: "entrada",
  valor: item.valorEntrada,
});

export const mapLancamentoToDisplay = (item: FinanceiroLancamento): FinanceiroDisplayItem => ({
  categoria: item.categoria,
  data_lancamento: item.data_lancamento,
  deletable: item.origem !== "pagamento",
  descricao: item.descricao,
  evento_id: item.evento_id,
  id: `lancamento-${item.id}`,
  ledgerId: item.id,
  origem: item.origem,
  tipo: item.tipo,
  valor: item.valor,
});

/** Entradas do DRE: apenas sinal/reserva da festa (contrato assinado). */
export const buildDreEntradas = (contratoEntradas: FinanceiroContratoEntrada[]): FinanceiroDisplayItem[] =>
  sortDisplayItems(contratoEntradas.map(mapContratoEntradaToDisplay));

const sortDisplayItems = (items: FinanceiroDisplayItem[]) =>
  [...items].sort(
    (a, b) => b.data_lancamento.localeCompare(a.data_lancamento) || b.id.localeCompare(a.id),
  );

/** Reservas geradas automaticamente na assinatura do contrato. */
export const buildEntradasFestasAutomaticas = buildDreEntradas;

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
