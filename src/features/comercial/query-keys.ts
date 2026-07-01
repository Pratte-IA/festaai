export const comercialQueryKeys = {
  adminContractAcceptance: (id: number) => ["admin", "comercial", "contract-acceptance", id] as const,
  adminContractAcceptances: () => ["admin", "comercial", "contract-acceptances"] as const,
  adminContracts: () => ["admin", "comercial", "contracts"] as const,
  adminLead: (id: number | null) => ["admin", "comercial", "leads", id] as const,
  adminLeads: (status?: string) => ["admin", "comercial", "leads", status ?? "all"] as const,
  adminOffer: (id: number | null) => ["admin", "comercial", "offers", id] as const,
  adminOffers: (status?: string) => ["admin", "comercial", "offers", status ?? "all"] as const,
  publicOffer: (token: string | undefined) => ["comercial", "public-offer", token] as const,
  tenantBilling: (tenantId: number) => ["admin", "tenant-billing", tenantId] as const,
};
