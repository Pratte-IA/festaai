export const guidedSetupQueryKeys = {
  all: ["guided-setup"] as const,
  companyProfile: (tenantId: number | null) => ["guided-setup", "company-profile", tenantId] as const,
  derived: (tenantId: number | null) => ["guided-setup", "derived", tenantId] as const,
  progress: (tenantId: number | null) => ["guided-setup", "progress", tenantId] as const,
};
