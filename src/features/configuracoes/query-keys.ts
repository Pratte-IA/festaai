export const configuracoesQueryKeys = {
  additionals: (tenantId: number | null) => ["configuracoes", tenantId, "additionals"] as const,
  checklist: (tenantId: number | null, packageId?: string | null) =>
    ["configuracoes", tenantId, "checklist", packageId ?? null] as const,
  estrutura: (tenantId: number | null) => ["configuracoes", tenantId, "estrutura"] as const,
  financial: (tenantId: number | null) => ["configuracoes", tenantId, "financial"] as const,
  holidays: (tenantId: number | null, year?: number) =>
    ["configuracoes", tenantId, "holidays", year ?? null] as const,
  messages: (tenantId: number | null) => ["configuracoes", tenantId, "messages"] as const,
  packages: (tenantId: number | null) => ["configuracoes", tenantId, "packages"] as const,
  packagesAdmin: (tenantId: number | null) => ["configuracoes", tenantId, "packages-admin"] as const,
  additionalsAdmin: (tenantId: number | null) => ["configuracoes", tenantId, "additionals-admin"] as const,
  plans: (tenantId: number | null) => ["configuracoes", tenantId, "plans"] as const,
  paymentMethods: (tenantId: number | null) => ["configuracoes", tenantId, "payment-methods"] as const,
  acceptanceTerms: (tenantId: number | null) => ["configuracoes", tenantId, "acceptance-terms"] as const,
  closingForm: (tenantId: number | null) => ["configuracoes", tenantId, "closing-form"] as const,
  satisfactionSurvey: (tenantId: number | null) =>
    ["configuracoes", tenantId, "satisfaction-survey"] as const,
  satisfactionSurveySubmissionsList: (tenantId: number | null) =>
    ["configuracoes", tenantId, "satisfaction-survey", "submissions"] as const,
  satisfactionSurveyResponses: (tenantId: number | null, eventoId: number | null) =>
    ["configuracoes", tenantId, "satisfaction-survey", "responses", eventoId] as const,
};
