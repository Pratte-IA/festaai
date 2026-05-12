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
