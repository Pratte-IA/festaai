export {
  executedStages,
  funnelTabs,
  partyStages,
  salesStages,
  stageMap,
} from "./constants";
export { eventosQueryKeys } from "./query-keys";
export { filterExecutadasFunnelEvents, filterExecutadasFunnelEventsByPartyDate } from "./filter-executadas-funnel-events";
export { filterEventosBySearch, matchesEventoSearch } from "./filter-eventos-by-search";
export { getEventoPackageDisplay } from "./evento-package-display";
export { getEventoDataEntradaInstant, getEventoDataEntradaIso } from "./get-evento-data-entrada";
export {
  getEventBalance,
  getEventBalanceFromReceivable,
  getEventDisplayTotalPaid,
  getEventoEntradaDescricao,
  getEventoEntradaReferenceDate,
  getEventRecordedPaid,
  isEventFullySettled,
} from "./event-financial";
export {
  isCalendarOrcamentoEvento,
  isCalendarVisitaEvento,
  isClosedPartyEvento,
  isArchivedCrmEvento,
  isInactiveEvento,
  isScheduledPartyEvento,
} from "./is-closed-party-event";
export type { EventoPackageDisplay } from "./evento-package-display";
export { getDefaultStageForFunnel, isStageValidForFunnel } from "./stage-validation";
export {
  shouldShowEventChecklist,
  parseChecklistConcluidos,
  calculateChecklistProgress,
  isChecklistComplete,
} from "./evento-checklist";
export { useEventoChecklist } from "./use-evento-checklist";
export {
  buildLeadImportCsvTemplate,
  downloadLeadImportCsvTemplate,
  getLeadImportCsvFilename,
  getLeadImportFunnelLabel,
  getLeadImportStageLabel,
  LEAD_IMPORT_CSV_HEADERS,
} from "./lead-import-csv-template";
export {
  MAX_LEAD_UPLOAD_ROWS,
  parseLeadImportCsv,
  resolveEtapaCell,
  resolveFunilCell,
  resolveTipoEventoCell,
} from "./parse-leads-csv";
export type { LeadCsvParseResult, LeadCsvRowParsed } from "./parse-leads-csv";
export { normalizePackageMatchKey, resolvePackageByName } from "./resolve-package-by-name";
export { sortEventosByPartyDateExecutionOrder } from "./sort-eventos-by-party-date";
export {
  formatPostPartyAutomationEffectiveDateBR,
  getBrazilTodayIsoDate,
  isPostPartyAutomationActive,
  POST_PARTY_AUTOMATION_EFFECTIVE_DATE,
  shouldTransitionToAguardandoFeedback,
} from "./post-party-automation";
export {
  DEFAULT_PROPOSTA_FOLLOWUP_1_DATA_INDISPONIVEL,
  DEFAULT_PROPOSTA_FOLLOWUP_1_DATA_LIVRE,
  DEFAULT_PROPOSTA_FOLLOWUP_2_DATA_INDISPONIVEL,
  DEFAULT_PROPOSTA_FOLLOWUP_2_DATA_LIVRE,
  DEFAULT_PROPOSTA_FOLLOWUP_3_VISITA,
  DEFAULT_PROPOSTA_FOLLOWUP_4_ENCERRAMENTO,
  getPropostaFollowupKanbanBadge,
  getPropostaFollowupRespondedKanbanBadge,
  PROPOSTA_FOLLOWUP_1_DELAY_HOURS,
  PROPOSTA_FOLLOWUP_1_TEMPLATE_DATA_INDISPONIVEL,
  PROPOSTA_FOLLOWUP_1_TEMPLATE_DATA_LIVRE,
  PROPOSTA_FOLLOWUP_2_DELAY_HOURS,
  PROPOSTA_FOLLOWUP_2_TEMPLATE_DATA_INDISPONIVEL,
  PROPOSTA_FOLLOWUP_2_TEMPLATE_DATA_LIVRE,
  PROPOSTA_FOLLOWUP_3_DELAY_HOURS,
  PROPOSTA_FOLLOWUP_3_TEMPLATE_VISITA,
  PROPOSTA_FOLLOWUP_4_DELAY_HOURS,
  PROPOSTA_FOLLOWUP_4_TEMPLATE_ENCERRAMENTO,
  PROPOSTA_FOLLOWUP_LOSS_MOTIVO,
  PROPOSTA_FOLLOWUP_TEMPLATE_KEY,
  propostaFollowupStatusLabels,
} from "./proposta-followup";
export type {
  PropostaFollowup1Variante,
  PropostaFollowup2Variante,
  PropostaFollowupStatus,
} from "./proposta-followup";
export {
  DEFAULT_PERDIDO_REATIVACAO_FOP1,
  DEFAULT_PERDIDO_REATIVACAO_FOP2,
  DEFAULT_PERDIDO_REATIVACAO_FOP3,
  getPerdidoReativacaoKanbanBadge,
  getPerdidoReativacaoRespondedKanbanBadge,
  PERDIDO_REATIVACAO_FOP1_TEMPLATE,
  PERDIDO_REATIVACAO_FOP2_TEMPLATE,
  PERDIDO_REATIVACAO_FOP3_TEMPLATE,
  PERDIDO_REATIVACAO_TEMPLATE_KEY,
} from "./perdido-reativacao-followup";
export type { PerdidoReativacaoStatus } from "./perdido-reativacao-followup";
export {
  DEFAULT_PERDIDO_FUTURO_FUP1_DATA_INDISPONIVEL,
  DEFAULT_PERDIDO_FUTURO_FUP1_DATA_LIVRE,
  getPerdidoFuturoKanbanBadge,
  getPerdidoOportunidadeKanbanBadge,
  getPerdidoOportunidadeRespondedKanbanBadge,
  PERDIDO_FUTURO_FUP1_TEMPLATE_DATA_INDISPONIVEL,
  PERDIDO_FUTURO_FUP1_TEMPLATE_DATA_LIVRE,
} from "./perdido-futuro-followup";
export type { PerdidoFuturoFup1Variante } from "./perdido-futuro-followup";
export { PERDIDO_FUTURO_FUP1_DAYS_BEFORE } from "./perdido-futuro-schedule";
export {
  PERDIDO_REATIVACAO_FOP1_MONTHS_BEFORE,
  PERDIDO_REATIVACAO_FOP2_DELAY_DAYS,
  PERDIDO_REATIVACAO_FOP3_DAYS_BEFORE,
} from "./perdido-reativacao-schedule";
export {
  CONTRACT_SIGNATURE_FOLLOWUP_INICIAL_DELAY_HOURS,
  CONTRACT_SIGNATURE_FOLLOWUP_LEMBRETE_DELAY_HOURS,
  CONTRACT_SIGNATURE_FOLLOWUP_TEMPLATE_KEY,
  getContractSignatureFollowupKanbanBadge,
} from "./contract-signature-followup";
export type { EventoContractSignatureFollowupSummary } from "./contract-signature-followup";
export { useBulkCreateEventos } from "./use-bulk-create-eventos";
export { useCreateEvento } from "./use-create-evento";
export { useEvento } from "./use-evento";
export { useCreateEventoNota, useEventoNotas } from "./use-evento-notas";
export {
  useCreateEventoPagamento,
  useDeleteEventoPagamento,
  useEventoPagamentos,
  useUpdateEventoPagamento,
} from "./use-evento-pagamentos";
export { useCreateEventoTarefa, useDeleteEventoTarefa, useEventoTarefas, useToggleEventoTarefa, useUpdateEventoTarefa } from "./use-evento-tarefas";
export { useEventos } from "./use-eventos";
export { useDeleteEvento } from "./use-delete-evento";
export { useUpdateEvento } from "./use-update-evento";
export { useUpdateEventoStage } from "./use-update-evento-stage";
export {
  useEventoAcceptanceResponses,
  useEventoClosingResponses,
  useSubmitClosingForm,
} from "./use-evento-closing-form";
export {
  useEventoImageUsageAcceptance,
  type EventoImageUsageAcceptanceResult,
  type ImageUsageAcceptanceStatus,
} from "./use-evento-image-usage-acceptance";
export {
  useAcceptEventoContract,
  useEventoContract,
  useEventoContractAcceptance,
  useGenerateEventoContract,
  useTenantDefaultContractTemplate,
} from "./use-evento-contract";
export {
  useContractAcceptance,
  useContractById,
  useEventoContractHistory,
  useTenantContracts,
} from "./use-tenant-contracts";
export { useTenantFormSubmissions } from "./use-tenant-form-submissions";
export type { TenantFormSubmissionListItem } from "./form-submission-types";
export {
  useAcceptContractModuleTerms,
  useIsContractModuleEnabled,
  useTenantContractModuleAcceptance,
} from "./use-tenant-contract-module-acceptance";
export type { TenantContractModuleAcceptance } from "./use-tenant-contract-module-acceptance";
export {
  useCompleteContractModelsReview,
  useIsContractModuleModelsConfigured,
  useIsContractModuleReady,
  useNeedsContractModelsReview,
  useRestartContractModuleSetup,
  useSaveContractModuleModels,
  useSaveContractTemplateParams,
  useTenantContractModuleSettings,
  useTenantContractTypeOptions,
  useSaveContractTemplateHtml,
  useRestoreContractTemplateHtml,
  useSyncLegacyContractTemplates,
} from "./use-tenant-contract-module-settings";
export type {
  TenantContractModuleSettings,
  TenantContractTypeOption,
} from "./use-tenant-contract-module-settings";
export type { TenantContractTemplateParams } from "./contracts/contract-template-params";
export {
  buildContractPreviewPlaceholders,
  computeEventExtraGuestUnitPrice,
  computeExtraGuestUnitPrice,
  computePackageExtraGuestUnitPrice,
  isTenantContractTemplateParamsComplete,
  renderContractTemplatePreview,
  validateTenantContractTemplateParams,
} from "./contracts/contract-template-params";
export {
  CONTRACT_TEMPLATE_DEFINITIONS,
  CONTRACT_TEMPLATE_KEYS,
  getContractTemplateDefinition,
  isContractTemplateKey,
} from "./contracts/contract-template-types";
export type { ContractTemplateDefinition, ContractTemplateKey } from "./contracts/contract-template-types";
export {
  CONTRACT_MODULE_ACCEPTANCE_DECLARATION,
  CONTRACT_MODULE_TERMS_SECTIONS,
  CONTRACT_MODULE_TERMS_TITLE,
  CONTRACT_MODULE_TERMS_VERSION,
} from "./contracts/contract-module-terms";
export { ContractStatusBadge, contractStatusLabels } from "./contracts/contract-status";
export type {
  ContractAcceptedFilter,
  ContractEventSummary,
  ContractStatusFilter,
  TenantContractListItem,
  TenantContractMetrics,
} from "./contracts/contract-list-types";
export type {
  AcceptEventoContractInput,
  ContractSnapshot,
  EventoContract,
  EventoContractAcceptance,
  EventoContractStatus,
  TenantContractTemplate,
} from "./contracts/contract-types";
export { formatContractHashShort, hashContractContent } from "./contracts/contract-hash";
export type { ClosingFormSubmission } from "./use-evento-closing-form";
export {
  appendConvidadosAlteracaoHistorico,
  buildConvidadosAlteracaoHistoricoEntry,
  getSignedContractFinancialSnapshot,
  parseConvidadosAlteracoesHistorico,
  recalculateEventoGuestPricing,
} from "./evento-guest-pricing";
export type { ConvidadosAlteracaoHistoricoEntry } from "./evento-guest-pricing";
export type { AdicionalSnapshotItem } from "./closing-form-runtime";
export {
  CLIENT_FORM_SECTIONS,
  CLOSING_FORM_SECTIONS,
  formatAdicionaisSelecionadosLabel,
  formatClosingFormResponseValue,
  getEventoFieldValueAsString,
  isClientFacingClosingFormField,
  isCustomClosingFormField,
  isClosingFormFieldApplicableToPackage,
  parseAdicionaisSnapshot,
} from "./closing-form-runtime";
export type {
  Evento,
  EventoInsert,
  EventoNota,
  EventoNotaInsert,
  EventoNotaUpdate,
  EventoPagamento,
  EventoPagamentoInsert,
  EventoPagamentoUpdate,
  EventoTarefa,
  EventoTarefaInsert,
  EventoTarefaUpdate,
  EventoUpdate,
  EventType,
  ExecutedStage,
  FunnelDefinition,
  FunnelType,
  InternalStatus,
  PartyStage,
  SalesStage,
  Stage,
  StageDefinition,
} from "./types";
