export const configuracoesQueryKeys = {
  additionals: (tenantId: number | null) => ["configuracoes", tenantId, "additionals"] as const,
  checklist: (tenantId: number | null) => ["configuracoes", tenantId, "checklist"] as const,
  estrutura: (tenantId: number | null) => ["configuracoes", tenantId, "estrutura"] as const,
  financial: (tenantId: number | null) => ["configuracoes", tenantId, "financial"] as const,
  messages: (tenantId: number | null) => ["configuracoes", tenantId, "messages"] as const,
  packages: (tenantId: number | null) => ["configuracoes", tenantId, "packages"] as const,
  plans: (tenantId: number | null) => ["configuracoes", tenantId, "plans"] as const,
};
