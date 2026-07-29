export const financeiroQueryKeys = {
  all: (tenantId: number | null) => ["financeiro", tenantId] as const,
  lancamentos: (tenantId: number | null, filters?: { eventoId?: number | null; from?: string; to?: string }) =>
    ["financeiro", tenantId, "lancamentos", filters ?? {}] as const,
  eventoSummary: (tenantId: number | null, eventoId: number | null) =>
    ["financeiro", tenantId, "evento-summary", eventoId] as const,
  festasOverview: (tenantId: number | null) => ["financeiro", tenantId, "festas-overview"] as const,
  competencia: (tenantId: number | null, month: string) =>
    ["financeiro", tenantId, "competencia", month] as const,
  contratoEntradas: (tenantId: number | null, from: string, to: string) =>
    ["financeiro", tenantId, "contrato-entradas", from, to] as const,
};
