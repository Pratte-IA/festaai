export {
  getFinanceiroCategoriaLabel,
  getFinanceiroCategoriaOptions,
  isFinanceiroCategoriaDesconto,
  resolveFinanceiroLancamentoValor,
  FINANCEIRO_CATEGORIAS_ENTRADA,
  FINANCEIRO_CATEGORIAS_SAIDA,
} from "./constants";
export type { FinanceiroCategoriaEntrada, FinanceiroCategoriaSaida } from "./constants";
export {
  buildDreEntradas,
  buildDrePeriodSummary,
  buildDreSaidas,
  buildEntradasFestasAutomaticas,
  buildEntradasFestasFluxoCaixa,
  buildEntradasManuaisGerais,
  buildSaidasFestas,
  buildSaidasGerais,
  mapContratoEntradaToDisplay,
  mapLancamentoToDisplay,
  sumDisplayItems,
} from "./build-dre-entradas";
export { buildDreStatement } from "./build-dre-statement";
export {
  buildFinanceiroReport,
  buildFinanceiroReportCsv,
  buildFinanceiroReportPdfHtml,
  buildFinanceiroReportXls,
  DEFAULT_FINANCEIRO_EXPORT_SECTIONS,
  downloadFinanceiroReport,
  getFinanceiroReportFilename,
} from "./export-financeiro-report";
export type {
  FinanceiroExportData,
  FinanceiroExportFormat,
  FinanceiroExportOptions,
  FinanceiroExportSections,
} from "./export-financeiro-report";
export type {
  DrePeriodSummary,
  DreStatement,
  DreStatementLine,
  FinanceiroContratoEntrada,
  FinanceiroDisplayItem,
} from "./display-types";
export {
  buildDashboardDescricaoRows,
  buildDashboardEntradaRows,
  buildDashboardSaidaRows,
  groupDisplayItemsByCategoria,
  groupLancamentosByCategoria,
} from "./dre-utils";
export type { DashboardDescricaoRow, DreCategoriaTotal } from "./dre-utils";
export {
  formatFinanceiroMonthLabel,
  getDefaultFinanceiroMonth,
  getMonthRange,
} from "./month-range";
export {
  buildEventoFinanceiroSummary,
  buildTenantFinanceiroPeriodSummary,
  computeEventMarginPercent,
  computeEventReceivableTotal,
  computeEventResult,
  computeEventRevenueTotal,
  sumUpsellEntradas,
} from "./party-financial";
export {
  applyCompetenciaFilters,
  buildCompetenciaPeriodResult,
  buildFinanceiroFestasOverview,
  computeCompetenciaReceitaFesta,
  formatCompetenciaMonthYear,
  getEventCompetenciaSituacao,
  getEventoCompetenciaInconsistencia,
  isDateInMonth,
  isEventEligibleForCompetencia,
  toCompetenciaMonthStart,
} from "./competencia";
export type {
  CompetenciaBucketSummary,
  CompetenciaCustoDireto,
  CompetenciaDespesaOperacional,
  CompetenciaFestaRow,
  CompetenciaPeriodResult,
  CompetenciaPeriodSummary,
  CompetenciaSituacao,
  FinanceiroFestaOverviewRow,
} from "./competencia";
export {
  buildFluxoCaixaEntradasFestas,
  buildFluxoCaixaEntradasSummary,
  computeFinanceiroPorFestaRecebido,
  computeFluxoCaixaRecebidoEvento,
  filterFluxoCaixaByConfiabilidade,
  getFluxoCaixaExportMeta,
  isFluxoCaixaLegacyItem,
  reconcileEventoCashReceived,
  shouldIncludeLegadoValorEntrada,
  shouldIncludeLedgerEntradaContrato,
  LEGADO_DATA_ESTIMADA_TOOLTIP,
} from "./fluxo-caixa";
export type {
  EventoCashReconciliationResult,
  FluxoCaixaConfiabilidadeFilter,
  FluxoCaixaEntradasSummary,
  FluxoCaixaExportMeta,
} from "./fluxo-caixa";
export { financeiroQueryKeys } from "./query-keys";
export type {
  EventoFinanceiroSummary,
  FinanceiroLancamento,
  FinanceiroLancamentoInsert,
  FinanceiroLancamentoUpdate,
  FinanceiroOrigem,
  FinanceiroTipo,
  TenantFinanceiroPeriodSummary,
} from "./types";
export {
  invalidateFinanceiroQueries,
  useCreateFinanceiroLancamento,
  useDeleteFinanceiroLancamento,
  useFinanceiroLancamentos,
} from "./use-financeiro-lancamentos";
export { useEventoFinanceiroSummary } from "./use-evento-financeiro-summary";
export { useFinanceiroContratoEntradas } from "./use-financeiro-contrato-entradas";
export type { FinanceiroContratoEntradasResult } from "./use-financeiro-contrato-entradas";
export { useFinanceiroCompetencia } from "./use-financeiro-competencia";
export { useFinanceiroFestasOverview } from "./use-financeiro-festas-overview";
