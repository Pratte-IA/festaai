export const COMMERCIAL_LEAD_STATUS_VALUES = ["novo", "em_contato", "convertido", "descartado"] as const;
export type CommercialLeadStatus = (typeof COMMERCIAL_LEAD_STATUS_VALUES)[number];

export const COMMERCIAL_OFFER_STATUS_VALUES = ["draft", "active", "accepted", "expired", "cancelled"] as const;
export type CommercialOfferStatus = (typeof COMMERCIAL_OFFER_STATUS_VALUES)[number];

export const BASE_PLAN_SLUG_VALUES = ["avista", "parcelado", "fidelidade"] as const;
export type BasePlanSlug = (typeof BASE_PLAN_SLUG_VALUES)[number];

export const COMMERCIAL_BILLING_CHANNEL_VALUES = ["asaas", "manual"] as const;
export type CommercialBillingChannel = (typeof COMMERCIAL_BILLING_CHANNEL_VALUES)[number];

export const commercialBillingChannelLabels: Record<CommercialBillingChannel, string> = {
  asaas: "Checkout Asaas (padrão)",
  manual: "Pagamento negociado (sem Asaas)",
};

export const commercialLeadStatusLabels: Record<CommercialLeadStatus, string> = {
  convertido: "Convertido",
  descartado: "Descartado",
  em_contato: "Em contato",
  novo: "Novo",
};

export const commercialOfferStatusLabels: Record<CommercialOfferStatus, string> = {
  accepted: "Aceita",
  active: "Ativa",
  cancelled: "Cancelada",
  draft: "Rascunho",
  expired: "Expirada",
};

export const basePlanSlugLabels: Record<BasePlanSlug, string> = {
  avista: "À vista",
  fidelidade: "Fidelidade",
  parcelado: "Parcelado",
};

/** Validade padrão de novas ofertas (dias). */
export const DEFAULT_OFFER_VALIDITY_DAYS = 2;

export const buildOfferPublicUrl = (token: string) =>
  `${typeof window !== "undefined" ? window.location.origin : ""}/contratar/oferta/${token}`;

export const generateOfferToken = (companyHint?: string | null) => {
  const slug = (companyHint ?? "proposta")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  return `${slug || "proposta"}-${suffix}`;
};

export const defaultOfferExpiresAt = () => {
  const date = new Date();
  date.setDate(date.getDate() + DEFAULT_OFFER_VALIDITY_DAYS);
  return date.toISOString();
};
