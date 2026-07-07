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

export const buildDreEntradas = (
  contratoEntradas: FinanceiroContratoEntrada[],
  lancamentos: FinanceiroLancamento[],
): FinanceiroDisplayItem[] => {
  const fromContracts = contratoEntradas.map(mapContratoEntradaToDisplay);
  const fromLedger = lancamentos
    .filter((item) => item.tipo === "entrada" && item.origem !== "pagamento")
    .map(mapLancamentoToDisplay);

  return [...fromContracts, ...fromLedger].sort((a, b) =>
    b.data_lancamento.localeCompare(a.data_lancamento) || b.id.localeCompare(a.id),
  );
};

export const buildDreSaidas = (lancamentos: FinanceiroLancamento[]): FinanceiroDisplayItem[] =>
  lancamentos
    .filter((item) => item.tipo === "saida")
    .map(mapLancamentoToDisplay)
    .sort((a, b) => b.data_lancamento.localeCompare(a.data_lancamento) || b.id.localeCompare(a.id));

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
