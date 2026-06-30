export interface ContratarCommercialCondition {
  slug: "avista" | "parcelado" | "fidelidade";
  name: string;
  description: string;
  monthly_price: number;
  setupDisplay: string;
  benefits: string[];
  cta: string;
  highlight: boolean;
  badgeLabel?: string;
  loyaltyLabel: string;
}

export const COMMERCIAL_CONDITIONS: ContratarCommercialCondition[] = [
  {
    slug: "avista",
    name: "À vista",
    description: "Para quem quer começar com desconto no setup e sem fidelidade.",
    monthly_price: 750,
    setupDisplay: "R$ 2.200,00 à vista",
    benefits: [
      "Plataforma completa FestaAI",
      "Agente FestaAI padrão incluso",
      "CRM de vendas e eventos",
      "Agenda e organização operacional",
      "Configuração inicial inclusa",
      "Sem fidelidade",
    ],
    cta: "Contratar à vista",
    highlight: false,
    loyaltyLabel: "Não",
  },
  {
    slug: "fidelidade",
    name: "Fidelidade",
    description:
      "Para quem quer a melhor condição comercial e pretende crescer com o FestaAI por pelo menos 12 meses.",
    monthly_price: 650,
    setupDisplay: "R$ 2.000,00 em até 6x",
    benefits: [
      "Plataforma completa FestaAI",
      "Agente FestaAI padrão incluso",
      "CRM de vendas e eventos",
      "Agenda e organização operacional",
      "Configuração inicial inclusa",
      "Menor mensalidade",
      "Fidelidade de 12 meses",
    ],
    cta: "Quero a melhor condição",
    highlight: true,
    badgeLabel: "Melhor condição",
    loyaltyLabel: "12 meses",
  },
  {
    slug: "parcelado",
    name: "Parcelado",
    description: "Para quem prefere diluir o valor da implantação e manter liberdade contratual.",
    monthly_price: 750,
    setupDisplay: "R$ 2.500,00 em até 6x",
    benefits: [
      "Plataforma completa FestaAI",
      "Agente FestaAI padrão incluso",
      "CRM de vendas e eventos",
      "Agenda e organização operacional",
      "Configuração inicial inclusa",
      "Setup parcelado em até 6x",
    ],
    cta: "Contratar parcelado",
    highlight: false,
    loyaltyLabel: "Não",
  },
];

export const formatContratarBRL = (value: number) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** Classes do botão CTA em degradê (landing e fluxo de contratação). */
export const contratarCtaGradientClass =
  "rounded-xl bg-[linear-gradient(135deg,#5158e7_0%,#d95693_58%,#c77dff_100%)] font-semibold text-white shadow-lg shadow-[#5158e7]/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#d95693]/35 focus-visible:ring-[#5158e7]/40";

export function findCommercialConditionBySlug(
  slug: string | undefined,
): ContratarCommercialCondition | undefined {
  if (!slug) return undefined;
  return COMMERCIAL_CONDITIONS.find((p) => p.slug === slug);
}

export function formatSetupDisplay(setupPrice: number, setupInstallments: number | null): string {
  const formatted = formatContratarBRL(setupPrice);
  if (!setupInstallments || setupInstallments <= 1) {
    return `${formatted} à vista`;
  }
  return `${formatted} em até ${setupInstallments}x`;
}

export function formatLoyaltyLabel(loyaltyMonths: number | null): string {
  if (!loyaltyMonths || loyaltyMonths <= 0) {
    return "Não";
  }
  return `${loyaltyMonths} meses`;
}

export interface CommercialOfferPricing {
  base_plan_slug: ContratarCommercialCondition["slug"];
  loyalty_months: number | null;
  monthly_price: number;
  name: string;
  setup_installments: number | null;
  setup_price: number;
}

export function buildConditionFromOffer(offer: CommercialOfferPricing): ContratarCommercialCondition {
  const base = findCommercialConditionBySlug(offer.base_plan_slug);
  return {
    slug: offer.base_plan_slug,
    name: offer.name,
    description: base?.description ?? "Proposta comercial exclusiva FestaAI.",
    monthly_price: Number(offer.monthly_price),
    setupDisplay: formatSetupDisplay(Number(offer.setup_price), offer.setup_installments),
    benefits: base?.benefits ?? COMMERCIAL_CONDITIONS[0].benefits,
    cta: "Aceitar proposta",
    highlight: true,
    badgeLabel: "Proposta exclusiva",
    loyaltyLabel: formatLoyaltyLabel(offer.loyalty_months),
  };
}

export const CONTRATAR_CONTACT = {
  email: "contato@festaai.com.br",
  whatsapp: {
    display: "(45) 99943-8936",
    e164: "5545999438936",
    defaultMessage: "Olá! Gostaria de saber mais sobre o FestaAI.",
    customPlanMessage: "Olá! Gostaria de ver um plano personalizado do FestaAI.",
    demoMessage: "Olá! Gostaria de agendar uma demonstração do FestaAI.",
  },
} as const;

export const CONTRATAR_LEGAL = {
  companyName: "Agência Roda Gigante Ltda",
  cnpj: "11.568.297/0001-02",
} as const;

export const getContratarWhatsappUrl = (
  message = CONTRATAR_CONTACT.whatsapp.defaultMessage,
) =>
  `https://wa.me/${CONTRATAR_CONTACT.whatsapp.e164}?text=${encodeURIComponent(message)}`;
