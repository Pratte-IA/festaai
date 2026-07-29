import { Evento, FunnelType, InternalStatus } from "@/features/eventos";

import {
  computeEventMarginPercent,
  computeEventReceivableTotal,
  computeEventResult,
} from "./party-financial";
import { FinanceiroLancamento } from "./types";

export type CompetenciaSituacao = "Previsto" | "Realizado";

export interface CompetenciaEventoInput {
  aniversariante_nome: string | null;
  cliente_nome: string;
  data_evento: string | null;
  funil: FunnelType;
  id: number;
  pacote_nome: string | null;
  status_interno: InternalStatus;
  valor_total: number;
}

export interface CompetenciaFestaRow {
  alertaInconsistencia: string | null;
  custosDiretos: number;
  dataEvento: string;
  eventoId: number;
  festaLabel: string;
  clienteNome: string;
  lucroBruto: number;
  margemPercent: number | null;
  pacoteNome: string | null;
  /** true quando valor contratado vigente <= 0 (cadastro a corrigir). */
  semReceitaCadastral: boolean;
  situacao: CompetenciaSituacao;
  valorContratado: number;
}

export interface CompetenciaDespesaOperacional {
  categoria: string;
  dataCompetencia: string;
  dataPagamento: string;
  descricao: string | null;
  id: number;
  /** Pago se data_lancamento preenchida; ledger atual não tem status pendente. */
  statusLabel: string;
  valor: number;
}

/** Saída vinculada a festa cuja data_competencia cai no mês do relatório. */
export interface CompetenciaCustoDireto {
  categoria: string;
  dataCompetencia: string;
  dataPagamento: string;
  descricao: string | null;
  eventoId: number;
  festaLabel: string;
  id: number;
  situacao: CompetenciaSituacao;
  valor: number;
}

export interface CompetenciaBucketSummary {
  custosDiretos: number;
  lucroBruto: number;
  receitaFestas: number;
  resultadoBruto: number;
}

export interface CompetenciaPeriodSummary {
  custosDiretos: number;
  despesasOperacionais: number;
  lucroBruto: number;
  margemLiquidaPercent: number | null;
  previsto: CompetenciaBucketSummary;
  realizado: CompetenciaBucketSummary;
  receitaFestas: number;
  resultadoLiquido: number;
}

export interface CompetenciaPeriodResult {
  /** Custos de festa no mês (filtro = data_competencia), inclusive de festas de outro mês. */
  custosDiretos: CompetenciaCustoDireto[];
  despesasOperacionais: CompetenciaDespesaOperacional[];
  festas: CompetenciaFestaRow[];
  summary: CompetenciaPeriodSummary;
}

type LancamentoCompetencia = Pick<
  FinanceiroLancamento,
  | "categoria"
  | "data_competencia"
  | "data_lancamento"
  | "descricao"
  | "evento_id"
  | "id"
  | "origem"
  | "tipo"
  | "valor"
>;

/** Converte qualquer data ISO/DATE no 1º dia do mês (YYYY-MM-01). */
export const toCompetenciaMonthStart = (dateValue: string): string => {
  const normalized = dateValue.slice(0, 10);
  const [year, month] = normalized.split("-");
  return `${year}-${month}-01`;
};

export const formatCompetenciaMonthYear = (monthStart: string): string => {
  const [year, month] = monthStart.slice(0, 10).split("-");
  return `${month}/${year}`;
};

/**
 * Festas com contratação válida para competência:
 * funil festa/executadas, com data_evento, sem cancelado/perdido.
 * Leads/orçamentos ficam em funil vendas e são excluídos.
 */
export const isEventEligibleForCompetencia = (
  event: Pick<CompetenciaEventoInput, "data_evento" | "funil" | "status_interno">,
): boolean => {
  if (!event.data_evento) {
    return false;
  }

  if (event.status_interno === "cancelado" || event.status_interno === "perdido") {
    return false;
  }

  return event.funil === "festa" || event.funil === "executadas";
};

/**
 * Fonte de realização do sistema: funil `executadas`.
 * Funil `festa` = contratada ainda não executada → Previsto.
 */
export const getEventCompetenciaSituacao = (
  event: Pick<CompetenciaEventoInput, "funil">,
): CompetenciaSituacao => (event.funil === "executadas" ? "Realizado" : "Previsto");

/**
 * Alerta operacional: data da festa já passou, mas o funil ainda é "festa".
 * Não altera a classificação Previsto/Realizado automaticamente.
 */
export const getEventoCompetenciaInconsistencia = (
  event: Pick<CompetenciaEventoInput, "data_evento" | "funil" | "status_interno">,
  todayIso = new Date().toISOString().slice(0, 10),
): string | null => {
  if (event.funil !== "festa") {
    return null;
  }

  if (event.status_interno === "cancelado" || event.status_interno === "perdido") {
    return null;
  }

  const dataEvento = event.data_evento?.slice(0, 10);
  if (!dataEvento || dataEvento >= todayIso) {
    return null;
  }

  return "Data da festa já passou, mas o evento ainda não foi marcado como executado.";
};
export const isDateInMonth = (dateValue: string | null | undefined, monthValue: string): boolean => {
  if (!dateValue) {
    return false;
  }

  return dateValue.slice(0, 7) === monthValue.slice(0, 7);
};

/**
 * Valor contratado vigente da festa para competência:
 * eventos.valor_total (pacote + adicionais do fechamento)
 * + adicionais/upsells do ledger
 * + descontos do ledger (negativos).
 * NÃO usa recebimentos/pagamentos.
 */
export const computeCompetenciaReceitaFesta = (
  event: Pick<CompetenciaEventoInput, "valor_total">,
  lancamentosDoEvento: LancamentoCompetencia[],
) => {
  const { adicionaisTotal, descontoTotal, receivableTotal } = computeEventReceivableTotal(
    event,
    lancamentosDoEvento,
  );

  return {
    adicionaisTotal,
    descontoTotal,
    valorContratado: receivableTotal,
  };
};

const festaLabelFromEvent = (event: Pick<CompetenciaEventoInput, "aniversariante_nome" | "cliente_nome" | "id">) =>
  event.aniversariante_nome?.trim() || event.cliente_nome?.trim() || `Festa #${event.id}`;

const sumSaidasByEvento = (lancamentos: LancamentoCompetencia[], eventoId: number) =>
  lancamentos
    .filter((item) => item.evento_id === eventoId && item.tipo === "saida")
    .reduce((sum, item) => sum + Number(item.valor || 0), 0);

const isSaidaFestaNoMesCompetencia = (
  item: LancamentoCompetencia,
  monthValue: string,
): boolean =>
  item.tipo === "saida" &&
  item.evento_id != null &&
  item.data_competencia != null &&
  isDateInMonth(item.data_competencia, monthValue);

const sumSaidasByEventoNoMesCompetencia = (
  lancamentos: LancamentoCompetencia[],
  eventoId: number,
  monthValue: string,
) =>
  lancamentos
    .filter((item) => item.evento_id === eventoId && isSaidaFestaNoMesCompetencia(item, monthValue))
    .reduce((sum, item) => sum + Number(item.valor || 0), 0);

const emptyBucket = (): CompetenciaBucketSummary => ({
  custosDiretos: 0,
  lucroBruto: 0,
  receitaFestas: 0,
  resultadoBruto: 0,
});

const buildBucket = (receitaFestas: number, custosDiretos: number): CompetenciaBucketSummary => {
  const lucroBruto = computeEventResult(receitaFestas, custosDiretos);
  return {
    custosDiretos,
    lucroBruto,
    receitaFestas,
    resultadoBruto: lucroBruto,
  };
};

const buildSummaryFromParts = (
  festas: CompetenciaFestaRow[],
  despesasOperacionaisTotal: number,
  custosDiretos: CompetenciaCustoDireto[],
): CompetenciaPeriodSummary => {
  const receitaPrevisto = festas
    .filter((row) => row.situacao === "Previsto")
    .reduce((sum, row) => sum + row.valorContratado, 0);
  const receitaRealizado = festas
    .filter((row) => row.situacao === "Realizado")
    .reduce((sum, row) => sum + row.valorContratado, 0);
  const custosPrevisto = custosDiretos
    .filter((row) => row.situacao === "Previsto")
    .reduce((sum, row) => sum + row.valor, 0);
  const custosRealizado = custosDiretos
    .filter((row) => row.situacao === "Realizado")
    .reduce((sum, row) => sum + row.valor, 0);

  const previsto = buildBucket(receitaPrevisto, custosPrevisto);
  const realizado = buildBucket(receitaRealizado, custosRealizado);
  const receitaFestas = receitaPrevisto + receitaRealizado;
  const custosDiretosTotal = custosPrevisto + custosRealizado;
  const lucroBruto = computeEventResult(receitaFestas, custosDiretosTotal);
  const resultadoLiquido = lucroBruto - despesasOperacionaisTotal;

  return {
    custosDiretos: custosDiretosTotal,
    despesasOperacionais: despesasOperacionaisTotal,
    lucroBruto,
    margemLiquidaPercent: computeEventMarginPercent(receitaFestas, resultadoLiquido),
    previsto,
    realizado,
    receitaFestas,
    resultadoLiquido,
  };
};

/**
 * Resultado por competência do mês:
 * - Receita = valor contratado vigente das festas do mês (data_evento; não usa recebimentos)
 * - Custos diretos = saídas com evento_id e data_competencia no mês (não usa data_evento nem data_lancamento)
 * - Despesas operacionais = saídas sem evento_id com data_competencia no mês
 * - Financeiro por festa (outra tela) continua somando todos os custos do evento, independente de mês
 */
export const buildCompetenciaPeriodResult = (
  monthValue: string,
  eventos: CompetenciaEventoInput[],
  lancamentos: LancamentoCompetencia[],
  options: { todayIso?: string } = {},
): CompetenciaPeriodResult => {
  const todayIso = options.todayIso ?? new Date().toISOString().slice(0, 10);
  const eligibleEventos = eventos.filter((evento) => isEventEligibleForCompetencia(evento));
  const eventosById = new Map(eligibleEventos.map((evento) => [evento.id, evento]));

  const eligibleInMonth = eligibleEventos.filter((evento) =>
    isDateInMonth(evento.data_evento, monthValue),
  );

  const festas: CompetenciaFestaRow[] = eligibleInMonth.map((evento) => {
    const eventLancamentos = lancamentos.filter((item) => item.evento_id === evento.id);
    const { valorContratado } = computeCompetenciaReceitaFesta(evento, eventLancamentos);
    const custosDiretos = sumSaidasByEventoNoMesCompetencia(lancamentos, evento.id, monthValue);
    const lucroBruto = computeEventResult(valorContratado, custosDiretos);
    const margemPercent = computeEventMarginPercent(valorContratado, lucroBruto);

    return {
      alertaInconsistencia: getEventoCompetenciaInconsistencia(evento, todayIso),
      custosDiretos,
      dataEvento: evento.data_evento!.slice(0, 10),
      eventoId: evento.id,
      festaLabel: festaLabelFromEvent(evento),
      clienteNome: evento.cliente_nome,
      lucroBruto,
      margemPercent,
      pacoteNome: evento.pacote_nome,
      semReceitaCadastral: valorContratado <= 0,
      situacao: getEventCompetenciaSituacao(evento),
      valorContratado,
    };
  });

  festas.sort((a, b) => a.dataEvento.localeCompare(b.dataEvento) || a.festaLabel.localeCompare(b.festaLabel));

  const custosDiretos: CompetenciaCustoDireto[] = lancamentos
    .filter((item) => isSaidaFestaNoMesCompetencia(item, monthValue))
    .flatMap((item) => {
      const evento = eventosById.get(item.evento_id as number);
      if (!evento) {
        return [];
      }

      return [
        {
          categoria: item.categoria,
          dataCompetencia: toCompetenciaMonthStart(item.data_competencia as string),
          dataPagamento: item.data_lancamento,
          descricao: item.descricao,
          eventoId: evento.id,
          festaLabel: festaLabelFromEvent(evento),
          id: item.id,
          situacao: getEventCompetenciaSituacao(evento),
          valor: Number(item.valor || 0),
        },
      ];
    })
    .sort(
      (a, b) =>
        a.dataPagamento.localeCompare(b.dataPagamento) ||
        a.festaLabel.localeCompare(b.festaLabel) ||
        a.id - b.id,
    );

  const despesasOperacionais: CompetenciaDespesaOperacional[] = lancamentos
    .filter(
      (item) =>
        item.tipo === "saida" &&
        item.evento_id == null &&
        item.data_competencia != null &&
        isDateInMonth(item.data_competencia, monthValue),
    )
    .map((item) => ({
      categoria: item.categoria,
      dataCompetencia: toCompetenciaMonthStart(item.data_competencia as string),
      dataPagamento: item.data_lancamento,
      descricao: item.descricao,
      id: item.id,
      statusLabel: "Registrada",
      valor: Number(item.valor || 0),
    }))
    .sort((a, b) => a.dataPagamento.localeCompare(b.dataPagamento) || a.id - b.id);

  const despesasOperacionaisTotal = despesasOperacionais.reduce((sum, row) => sum + row.valor, 0);

  return {
    custosDiretos,
    despesasOperacionais,
    festas,
    summary: buildSummaryFromParts(festas, despesasOperacionaisTotal, custosDiretos),
  };
};

/** Reaplica filtros de UI mantendo cards = soma das linhas exibidas. */
export const applyCompetenciaFilters = (
  result: CompetenciaPeriodResult,
  filters: {
    eventoId?: number | null;
    search?: string;
    statusFilter?: "todos" | "Previsto" | "Realizado";
  },
): CompetenciaPeriodResult => {
  const normalizedSearch = filters.search?.trim().toLowerCase() ?? "";
  const statusFilter = filters.statusFilter ?? "todos";

  const festas = result.festas.filter((festa) => {
    if (filters.eventoId != null && festa.eventoId !== filters.eventoId) {
      return false;
    }

    if (statusFilter !== "todos" && festa.situacao !== statusFilter) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    return (
      festa.festaLabel.toLowerCase().includes(normalizedSearch) ||
      festa.clienteNome.toLowerCase().includes(normalizedSearch)
    );
  });

  const custosDiretos = result.custosDiretos.filter((custo) => {
    if (filters.eventoId != null && custo.eventoId !== filters.eventoId) {
      return false;
    }

    if (statusFilter !== "todos" && custo.situacao !== statusFilter) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    return custo.festaLabel.toLowerCase().includes(normalizedSearch);
  });

  return {
    custosDiretos,
    despesasOperacionais: result.despesasOperacionais,
    festas,
    summary: buildSummaryFromParts(festas, result.summary.despesasOperacionais, custosDiretos),
  };
};

export type FinanceiroFestaOverviewRow = {
  aniversarianteNome: string | null;
  clienteNome: string;
  custosDiretos: number;
  dataEvento: string | null;
  despesasRegistradas: number;
  eventoId: number;
  funil: FunnelType;
  pacoteNome: string | null;
  resultado: number;
  saldoAReceber: number;
  statusLabel: string;
  valorContratado: number;
  valorRecebido: number;
};

export const buildFinanceiroFestasOverview = (
  eventos: Array<
    Pick<
      Evento,
      | "aniversariante_nome"
      | "cliente_nome"
      | "data_evento"
      | "funil"
      | "id"
      | "pacote_nome"
      | "status_interno"
      | "valor_entrada"
      | "valor_total"
    >
  >,
  lancamentos: LancamentoCompetencia[],
  paymentsByEvento: Map<number, number>,
): FinanceiroFestaOverviewRow[] => {
  const funnelLabels: Record<FunnelType, string> = {
    executadas: "Executada",
    festa: "Em festa",
    vendas: "Vendas",
  };

  return eventos
    .filter((evento) => isEventEligibleForCompetencia(evento))
    .map((evento) => {
      const eventLancamentos = lancamentos.filter((item) => item.evento_id === evento.id);
      const custosDiretos = eventLancamentos
        .filter((item) => item.tipo === "saida")
        .reduce((sum, item) => sum + Number(item.valor || 0), 0);
      const pagamentosLedger = eventLancamentos
        .filter((item) => item.tipo === "entrada" && item.categoria === "pagamento_contrato")
        .reduce((sum, item) => sum + Number(item.valor || 0), 0);
      const pagamentosExtras = paymentsByEvento.get(evento.id) ?? pagamentosLedger;
      const { valorContratado } = computeCompetenciaReceitaFesta(evento, eventLancamentos);
      const valorRecebido =
        evento.funil === "executadas"
          ? valorContratado
          : Number(evento.valor_entrada || 0) + pagamentosExtras;
      const saldoAReceber =
        evento.funil === "executadas" ? 0 : Math.max(valorContratado - valorRecebido, 0);
      const resultado = computeEventResult(valorContratado, custosDiretos);

      return {
        aniversarianteNome: evento.aniversariante_nome,
        clienteNome: evento.cliente_nome,
        custosDiretos,
        dataEvento: evento.data_evento,
        despesasRegistradas: custosDiretos,
        eventoId: evento.id,
        funil: evento.funil,
        pacoteNome: evento.pacote_nome,
        resultado,
        saldoAReceber,
        statusLabel: funnelLabels[evento.funil],
        valorContratado,
        valorRecebido,
      };
    })
    .sort((a, b) => {
      const dateA = a.dataEvento ?? "";
      const dateB = b.dataEvento ?? "";
      return dateB.localeCompare(dateA) || a.clienteNome.localeCompare(b.clienteNome);
    });
};

export { emptyBucket };
