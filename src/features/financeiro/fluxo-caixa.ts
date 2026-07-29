import { FinanceiroContratoEntrada, FinanceiroDisplayItem } from "./display-types";
import { FinanceiroLancamento } from "./types";

/**
 * Fonte de verdade do Fluxo de Caixa (entradas de festa):
 *
 * 1) financeiro_lancamentos com data_lancamento real
 *    - pagamento_contrato / origem=pagamento → sync de evento_pagamentos (não usar as duas tabelas)
 *    - entrada_contrato no ledger → só se o evento NÃO tiver valor_entrada > 0 (evita duplicar o sinal)
 *
 * 2) eventos.valor_entrada → sinal legado complementar às parcelas
 *    - NÃO é prova de data real de recebimento
 *    - data estimada = fechamento_confirmado_em ?? created_at, sempre marcada como legado
 *
 * Nunca usar created_at/fechamento como se fossem data de caixa sem flag.
 * Nunca somar evento_pagamentos + ledger do mesmo pagamento.
 */

export type FluxoCaixaEntradaKind = "legado_valor_entrada" | "ledger_pagamento" | "ledger_entrada_contrato";

export interface FluxoCaixaLegadoSinal {
  clienteNome: string;
  estimatedDate: string;
  eventoId: number;
  id: number;
  isLegacyEstimate: true;
  kind: "legado_valor_entrada";
  valorEntrada: number;
}

export interface EventoCashReconciliationInput {
  eventoId: number;
  /** Sinal cadastrado em eventos.valor_entrada */
  valorEntrada: number;
  /** Soma de evento_pagamentos (fonte primária dos detalhados) */
  pagamentosDetalhadosTotal: number;
  /** Soma ledger pagamento_contrato do evento */
  ledgerPagamentosTotal: number;
  /** Soma ledger entrada_contrato do evento */
  ledgerEntradaContratoTotal: number;
}

export interface EventoCashReconciliationResult {
  eventoId: number;
  fluxoCaixaTotal: number;
  financeiroPorFestaTotal: number;
  divergencia: number;
  isReconciled: boolean;
  /** true quando ledger de pagamentos bate com evento_pagamentos */
  pagamentosSyncOk: boolean;
}

const toIsoDate = (value: string) => value.slice(0, 10);

const isLedgerPagamentoCaixa = (item: Pick<FinanceiroLancamento, "categoria" | "origem" | "tipo">) =>
  item.tipo === "entrada" &&
  (item.origem === "pagamento" || item.categoria === "pagamento_contrato");

const isLedgerEntradaContrato = (item: Pick<FinanceiroLancamento, "categoria" | "tipo">) =>
  item.tipo === "entrada" && item.categoria === "entrada_contrato";

/**
 * Decide se o sinal (valor_entrada) entra no caixa como legado.
 * Entra quando há valor_entrada > 0 — é complementar às parcelas detalhadas.
 */
export const shouldIncludeLegadoValorEntrada = (valorEntrada: number) => Number(valorEntrada || 0) > 0;

/**
 * Entrada_contrato no ledger só entra no caixa se o evento não tiver valor_entrada,
 * para não duplicar o sinal já representado pelo campo legado.
 */
export const shouldIncludeLedgerEntradaContrato = (valorEntradaDoEvento: number) =>
  Number(valorEntradaDoEvento || 0) <= 0;

export const mapLegadoSinalToContratoEntrada = (
  item: FluxoCaixaLegadoSinal,
): FinanceiroContratoEntrada => ({
  clienteNome: item.clienteNome,
  contractId: null,
  estimatedDate: true,
  eventoId: item.eventoId,
  id: item.id,
  isLegacyEstimate: true,
  referenceAt: item.estimatedDate,
  valorEntrada: item.valorEntrada,
});

export const mapContratoEntradaToDisplay = (item: FinanceiroContratoEntrada): FinanceiroDisplayItem => {
  const isLegacy = Boolean(item.isLegacyEstimate);
  const baseDescricao = item.clienteNome;

  return {
    categoria: "entrada_contrato",
    data_lancamento: toIsoDate(item.referenceAt),
    deletable: false,
    descricao: baseDescricao,
    evento_id: item.eventoId,
    id: `contrato-${item.id}`,
    isLegacyEstimate: isLegacy,
    origem: isLegacy ? "legado_valor_entrada" : "contrato",
    tipo: "entrada",
    valor: item.valorEntrada,
  };
};

export const mapLancamentoToFluxoDisplay = (item: FinanceiroLancamento): FinanceiroDisplayItem => ({
  categoria: item.categoria,
  data_lancamento: item.data_lancamento,
  deletable: item.origem !== "pagamento",
  descricao: item.descricao,
  evento_id: item.evento_id,
  id: `lancamento-${item.id}`,
  ledgerId: item.id,
  origem: item.origem,
  tipo: item.tipo === "saida" ? "saida" : "entrada",
  valor: item.valor,
});

/** Entradas de festa no fluxo: sinal legado + pagamentos do ledger (sem duplicar sync). */
export const buildFluxoCaixaEntradasFestas = (
  legadoSinais: FinanceiroContratoEntrada[],
  lancamentos: FinanceiroLancamento[],
  valorEntradaByEvento: Map<number, number> = new Map(),
): FinanceiroDisplayItem[] => {
  const legadoItems = legadoSinais
    .filter((item) => shouldIncludeLegadoValorEntrada(item.valorEntrada))
    .map(mapContratoEntradaToDisplay);

  const ledgerPagamentos = lancamentos
    .filter((item) => item.evento_id != null && isLedgerPagamentoCaixa(item))
    .map(mapLancamentoToFluxoDisplay);

  const ledgerEntradaContrato = lancamentos
    .filter((item) => {
      if (item.evento_id == null || !isLedgerEntradaContrato(item)) {
        return false;
      }
      const valorEntrada = valorEntradaByEvento.get(item.evento_id) ?? 0;
      return shouldIncludeLedgerEntradaContrato(valorEntrada);
    })
    .map(mapLancamentoToFluxoDisplay);

  return sortDisplayItems([...legadoItems, ...ledgerPagamentos, ...ledgerEntradaContrato]);
};

const sortDisplayItems = (items: FinanceiroDisplayItem[]) =>
  [...items].sort(
    (a, b) => b.data_lancamento.localeCompare(a.data_lancamento) || b.id.localeCompare(a.id),
  );

/**
 * Total recebido no Financeiro por festa = valor_entrada + soma(evento_pagamentos).
 * Espelha a UI de EventoFinanceiro.
 */
export const computeFinanceiroPorFestaRecebido = (
  valorEntrada: number,
  pagamentosDetalhadosTotal: number,
) => Number(valorEntrada || 0) + Number(pagamentosDetalhadosTotal || 0);

/**
 * Total do mesmo evento no Fluxo de Caixa, com a regra de deduplicação.
 */
export const computeFluxoCaixaRecebidoEvento = (
  valorEntrada: number,
  ledgerPagamentosTotal: number,
  ledgerEntradaContratoTotal: number,
) => {
  const legado = shouldIncludeLegadoValorEntrada(valorEntrada) ? Number(valorEntrada || 0) : 0;
  const entradaContratoLedger = shouldIncludeLedgerEntradaContrato(valorEntrada)
    ? Number(ledgerEntradaContratoTotal || 0)
    : 0;

  return legado + Number(ledgerPagamentosTotal || 0) + entradaContratoLedger;
};

export const reconcileEventoCashReceived = (
  input: EventoCashReconciliationInput,
): EventoCashReconciliationResult => {
  const financeiroPorFestaTotal = computeFinanceiroPorFestaRecebido(
    input.valorEntrada,
    input.pagamentosDetalhadosTotal,
  );
  const fluxoCaixaTotal = computeFluxoCaixaRecebidoEvento(
    input.valorEntrada,
    input.ledgerPagamentosTotal,
    input.ledgerEntradaContratoTotal,
  );
  const divergencia = fluxoCaixaTotal - financeiroPorFestaTotal;
  const pagamentosSyncOk =
    Math.abs(Number(input.pagamentosDetalhadosTotal || 0) - Number(input.ledgerPagamentosTotal || 0)) <
    0.005;

  return {
    divergencia,
    eventoId: input.eventoId,
    financeiroPorFestaTotal,
    fluxoCaixaTotal,
    isReconciled: Math.abs(divergencia) < 0.005,
    pagamentosSyncOk,
  };
};

/** Filtra itens do fluxo cuja data real/estimada cai no mês. */
export const filterFluxoItemsByDateRange = <T extends { data_lancamento?: string; referenceAt?: string }>(
  items: T[],
  from: string,
  to: string,
  getDate: (item: T) => string,
) =>
  items.filter((item) => {
    const date = toIsoDate(getDate(item));
    return date >= from && date <= to;
  });

export const isCashMovementLancamento = (
  item: Pick<FinanceiroLancamento, "categoria" | "origem" | "tipo" | "evento_id">,
) => {
  if (item.tipo === "saida") {
    return true;
  }

  if (item.tipo !== "entrada") {
    return false;
  }

  // Entradas de caixa: pagamentos, entrada_contrato, outras receitas gerais.
  // Adicionais/descontos contratados não são movimento de caixa por si só.
  if (item.evento_id == null) {
    return item.origem === "manual" && item.categoria === "outras_receitas";
  }

  return isLedgerPagamentoCaixa(item) || isLedgerEntradaContrato(item);
};

export type FluxoCaixaConfiabilidadeFilter = "todos" | "confirmados" | "legados";

export const LEGADO_DATA_ESTIMADA_TOOLTIP =
  "Este recebimento é um registro histórico sem data real de pagamento. A data apresentada foi estimada com base no fechamento ou criação do evento.";

export const isFluxoCaixaLegacyItem = (item: Pick<FinanceiroDisplayItem, "isLegacyEstimate" | "origem">) =>
  Boolean(item.isLegacyEstimate) || item.origem === "legado_valor_entrada";

export const filterFluxoCaixaByConfiabilidade = (
  items: FinanceiroDisplayItem[],
  filter: FluxoCaixaConfiabilidadeFilter,
): FinanceiroDisplayItem[] => {
  if (filter === "confirmados") {
    return items.filter((item) => !isFluxoCaixaLegacyItem(item));
  }

  if (filter === "legados") {
    return items.filter((item) => isFluxoCaixaLegacyItem(item));
  }

  return items;
};

export interface FluxoCaixaEntradasSummary {
  confirmadasTotal: number;
  confirmadasCount: number;
  legadasTotal: number;
  legadasCount: number;
  total: number;
  totalCount: number;
}

export const buildFluxoCaixaEntradasSummary = (
  items: FinanceiroDisplayItem[],
): FluxoCaixaEntradasSummary => {
  const confirmadas = items.filter((item) => !isFluxoCaixaLegacyItem(item));
  const legadas = items.filter((item) => isFluxoCaixaLegacyItem(item));
  const confirmadasTotal = confirmadas.reduce((sum, item) => sum + item.valor, 0);
  const legadasTotal = legadas.reduce((sum, item) => sum + item.valor, 0);

  return {
    confirmadasCount: confirmadas.length,
    confirmadasTotal,
    legadasCount: legadas.length,
    legadasTotal,
    total: confirmadasTotal + legadasTotal,
    totalCount: items.length,
  };
};

export interface FluxoCaixaExportMeta {
  data_confirmada: "Sim" | "Não";
  observacao: string;
  origem_movimento: string;
}

export const getFluxoCaixaExportMeta = (item: FinanceiroDisplayItem): FluxoCaixaExportMeta => {
  if (isFluxoCaixaLegacyItem(item)) {
    return {
      data_confirmada: "Não",
      observacao: "Data estimada pelo fechamento/criação do evento",
      origem_movimento: "Sinal legado",
    };
  }

  if (item.tipo === "saida") {
    if (item.categoria === "devolucao_cliente") {
      return {
        data_confirmada: "Sim",
        observacao: "",
        origem_movimento: "Devolução de cliente",
      };
    }

    if (item.categoria === "estorno") {
      return {
        data_confirmada: "Sim",
        observacao: "",
        origem_movimento: "Estorno",
      };
    }

    return {
      data_confirmada: "Sim",
      observacao: "",
      origem_movimento: item.evento_id != null ? "Saída da festa" : "Saída manual",
    };
  }

  if (item.origem === "pagamento" || item.categoria === "pagamento_contrato") {
    return {
      data_confirmada: "Sim",
      observacao: "",
      origem_movimento: "Pagamento confirmado",
    };
  }

  if (item.categoria === "retencao_sinal_multa") {
    return {
      data_confirmada: "Sim",
      observacao: "",
      origem_movimento: "Retenção de sinal / multa",
    };
  }

  if (item.evento_id != null) {
    return {
      data_confirmada: "Sim",
      observacao: "",
      origem_movimento: "Lançamento da festa",
    };
  }

  return {
    data_confirmada: "Sim",
    observacao: "",
    origem_movimento: "Entrada manual",
  };
};
