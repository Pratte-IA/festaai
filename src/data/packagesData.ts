import {
  buildPricingSchedule,
  DEFAULT_PRICING_SCHEDULE,
  isPricingTiersPayload,
  normalizePricingSchedule,
  type PricingSchedule,
  type PricingTiersPayload,
} from "@/data/pricing-schedule";

export interface BuffetBlock {
  /** Quando `false`, o pacote não inclui buffet (ex.: somente aluguel do espaço). */
  hasBuffet?: boolean;
  salgados: string[];
  doces: string[];
  bolo: string[];
  bebidas: string[];
}

export const packageHasBuffet = (buffet: BuffetBlock): boolean => buffet.hasBuffet !== false;

export const emptyBuffetBlock = (): BuffetBlock => ({
  salgados: [],
  doces: [],
  bolo: [],
  bebidas: [],
});

const BOLO_IN_DOCES_PATTERN = /bolo/i;

/** Separa itens de bolo que ficaram em doces (dados antigos). */
const splitBoloFromDoces = (doces: string[], bolo: string[]) => {
  if (bolo.length > 0) {
    return { doces, bolo };
  }

  const migratedBolo = doces.filter((item) => BOLO_IN_DOCES_PATTERN.test(item));
  if (migratedBolo.length === 0) {
    return { doces, bolo };
  }

  return {
    doces: doces.filter((item) => !BOLO_IN_DOCES_PATTERN.test(item)),
    bolo: migratedBolo,
  };
};

export interface EstruturaBlock {
  brinquedos: string[];
  espaco: string[];
  decoracao: string[];
}

export interface EquipeRole {
  id: string;
  label: string;
  /** Quantidade inclusa por faixa de convidados (chave = id da pricingTier). */
  quantitiesByTier: Record<string, number>;
}

export type EquipeBlock = EquipeRole[];

export const DEFAULT_EQUIPE_ROLE_TEMPLATES = [
  { id: "garcom", label: "Garçom" },
  { id: "monitora", label: "Monitora" },
  { id: "limpeza", label: "Limpeza" },
] as const;

const LEGACY_EQUIPE_LABELS: Record<string, string> = {
  garcom: "Garçom",
  monitora: "Monitora",
  limpeza: "Limpeza",
};

type LegacyEquipeBlock = { garcom: number; monitora: number; limpeza: number };

const isLegacyEquipe = (equipe: unknown): equipe is LegacyEquipeBlock =>
  typeof equipe === "object" &&
  equipe !== null &&
  !Array.isArray(equipe) &&
  "garcom" in equipe;

export const getEquipeQuantity = (role: EquipeRole, tierId: string): number =>
  Math.max(0, role.quantitiesByTier[tierId] ?? 0);

export const formatEquipeForTier = (equipe: EquipeBlock, tierId: string): string => {
  const active = equipe.filter((role) => getEquipeQuantity(role, tierId) > 0);
  if (active.length === 0) return "Nenhum profissional incluso";
  return active.map((role) => `${getEquipeQuantity(role, tierId)}x ${role.label}`).join(" · ");
};

export const createDefaultEquipe = (tierIds: string[] = []): EquipeBlock =>
  DEFAULT_EQUIPE_ROLE_TEMPLATES.map((role) => ({
    id: role.id,
    label: role.label,
    quantitiesByTier: Object.fromEntries(tierIds.map((tierId) => [tierId, 1])),
  }));

export const syncEquipeWithTierIds = (equipe: EquipeBlock, tierIds: string[]): EquipeBlock =>
  equipe.map((role) => {
    const quantitiesByTier = { ...role.quantitiesByTier };
    const previousTierId = tierIds[tierIds.length - 2];

    for (const tierId of tierIds) {
      if (tierId in quantitiesByTier) continue;
      quantitiesByTier[tierId] =
        previousTierId !== undefined ? (quantitiesByTier[previousTierId] ?? 1) : 1;
    }

    for (const tierId of Object.keys(quantitiesByTier)) {
      if (!tierIds.includes(tierId)) delete quantitiesByTier[tierId];
    }

    return { ...role, quantitiesByTier };
  });

export const syncEquipeWithTiers = (equipe: EquipeBlock, tiers: PricingTier[]): EquipeBlock =>
  syncEquipeWithTierIds(equipe, tiers.map((tier) => tier.id));

type RawEquipeRole = {
  id?: string;
  label?: string;
  quantity?: number;
  quantitiesByTier?: Record<string, number>;
};

export const normalizeEquipe = (equipe: unknown, tierIds: string[] = []): EquipeBlock => {
  if (Array.isArray(equipe)) {
    const normalized = equipe
      .filter((role): role is RawEquipeRole => typeof role?.label === "string")
      .map((role) => {
        const label = role.label!.trim();
        const quantitiesByTier: Record<string, number> = {};

        if (role.quantitiesByTier && typeof role.quantitiesByTier === "object") {
          for (const [tierId, qty] of Object.entries(role.quantitiesByTier)) {
            quantitiesByTier[tierId] = Math.max(0, Number(qty) || 0);
          }
        } else {
          const qty = Math.max(0, Number(role.quantity) || 0);
          tierIds.forEach((tierId) => {
            quantitiesByTier[tierId] = qty;
          });
        }

        return {
          id: role.id ?? crypto.randomUUID(),
          label,
          quantitiesByTier,
        };
      })
      .filter((role) => role.label.length > 0);

    return tierIds.length > 0 ? syncEquipeWithTierIds(normalized, tierIds) : normalized;
  }

  if (isLegacyEquipe(equipe)) {
    return (Object.keys(LEGACY_EQUIPE_LABELS) as (keyof LegacyEquipeBlock)[]).map((key) => ({
      id: key,
      label: LEGACY_EQUIPE_LABELS[key],
      quantitiesByTier: Object.fromEntries(
        tierIds.map((tierId) => [tierId, Math.max(0, equipe[key] ?? 0)]),
      ),
    }));
  }

  return createDefaultEquipe(tierIds);
};

export const formatEquipeSummary = (equipe: EquipeBlock, tiers: PricingTier[] = []): string => {
  if (equipe.length === 0) return "Nenhum profissional incluso";
  if (tiers.length === 0) {
    const anyQty = equipe.some((role) => Object.values(role.quantitiesByTier).some((q) => q > 0));
    return anyQty ? "Equipe configurada" : "Nenhum profissional incluso";
  }
  if (tiers.length === 1) return formatEquipeForTier(equipe, tiers[0].id);

  return tiers
    .map((tier) => `${tier.minGuests}–${tier.maxGuests}: ${formatEquipeForTier(equipe, tier.id)}`)
    .join(" · ");
};

export interface PricingTier {
  id: string;
  minGuests: number;
  maxGuests: number;
  bandPrices: Record<string, number>;
}

const toNonNegativeNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

const normalizePricingTier = (
  tier: Record<string, unknown>,
  schedule: PricingSchedule,
): PricingTier => {
  const bandPrices: Record<string, number> = {};

  if (tier.bandPrices && typeof tier.bandPrices === "object") {
    for (const [bandId, price] of Object.entries(tier.bandPrices as Record<string, unknown>)) {
      bandPrices[bandId] = toNonNegativeNumber(price);
    }
  } else {
    const weekday = toNonNegativeNumber(tier.weekdayPrice);
    const weekend = toNonNegativeNumber(tier.weekendPrice);
    schedule.bands.forEach((band, index) => {
      bandPrices[band.id] = index === 0 ? weekday : index === 1 ? weekend : 0;
    });
  }

  for (const band of schedule.bands) {
    if (!(band.id in bandPrices)) {
      bandPrices[band.id] = 0;
    }
  }

  return {
    id: typeof tier.id === "string" && tier.id ? tier.id : crypto.randomUUID(),
    minGuests: toNonNegativeNumber(tier.minGuests),
    maxGuests: toNonNegativeNumber(tier.maxGuests),
    bandPrices,
  };
};

export const normalizePricingTiers = (raw: unknown, schedule = DEFAULT_PRICING_SCHEDULE): PricingTier[] => {
  const tiersRaw = isPricingTiersPayload(raw) ? raw.tiers : Array.isArray(raw) ? raw : [];

  return tiersRaw
    .filter((tier): tier is Record<string, unknown> => typeof tier === "object" && tier !== null)
    .map((tier) => normalizePricingTier(tier, schedule));
};

export const normalizePackagePricing = (
  raw: unknown,
): { schedule: PricingSchedule; tiers: PricingTier[] } => {
  if (isPricingTiersPayload(raw)) {
    const schedule = normalizePricingSchedule(raw.schedule);
    return {
      schedule,
      tiers: normalizePricingTiers(raw.tiers, schedule),
    };
  }

  const schedule = DEFAULT_PRICING_SCHEDULE;
  return {
    schedule,
    tiers: normalizePricingTiers(raw, schedule),
  };
};

export const serializePackagePricing = (
  schedule: PricingSchedule,
  tiers: PricingTier[],
): PricingTiersPayload => ({
  schedule,
  tiers,
});

export const normalizeBuffetBlock = (raw: unknown): BuffetBlock => {
  if (typeof raw !== "object" || raw === null) {
    return { salgados: [], doces: [], bolo: [], bebidas: [] };
  }

  const buffet = raw as Record<string, unknown>;
  const doces = Array.isArray(buffet.doces) ? buffet.doces.map(String) : [];
  const bolo = Array.isArray(buffet.bolo) ? buffet.bolo.map(String) : [];
  const split = splitBoloFromDoces(doces, bolo);

  return {
    hasBuffet: (buffet as { hasBuffet?: boolean }).hasBuffet !== false,
    salgados: Array.isArray(buffet.salgados) ? buffet.salgados.map(String) : [],
    doces: split.doces,
    bolo: split.bolo,
    bebidas: Array.isArray(buffet.bebidas) ? buffet.bebidas.map(String) : [],
  };
};

export interface PackageData {
  id: string;
  name: string;
  description: string;
  buffet: BuffetBlock;
  estrutura: EstruturaBlock;
  equipe: EquipeBlock;
  pricingSchedule: PricingSchedule;
  pricingTiers: PricingTier[];
  active?: boolean;
  durationMinutes?: number | null;
  excludedItems?: string[];
  includedGuests?: number | null;
  includedItems?: string[];
  rules?: string | null;
  sortOrder?: number;
}

export type { PricingSchedule };

export type AdditionalCategory =
  | "buffet"
  | "estrutura"
  | "equipe"
  | "entretenimento"
  | "decoracao"
  | "brinquedos"
  | "fotografia"
  | "lembrancinhas"
  | "tempo_adicional"
  | "outros";

export type AdditionalBillingType = "fixo" | "por_unidade" | "por_pessoa" | "por_hora";

export interface Additional {
  id: string;
  name: string;
  price: number;
  category: AdditionalCategory;
  type: AdditionalBillingType;
  active?: boolean;
  description?: string | null;
  /** IDs dos pacotes em que o adicional pode ser ofertado. Vazio = todos os pacotes. */
  packageIds?: string[];
  isRequired?: boolean;
  sortOrder?: number;
}

export const isAdditionalApplicableToPackage = (
  additional: Pick<Additional, "packageIds">,
  packageId: string | null | undefined,
): boolean => {
  if (!packageId) return false;
  const ids = additional.packageIds ?? [];
  if (ids.length === 0) return true;
  return ids.includes(packageId);
};

export const additionalCategoryLabels: Record<AdditionalCategory, string> = {
  buffet: "Buffet",
  brinquedos: "Brinquedos",
  decoracao: "Decoração",
  equipe: "Equipe",
  entretenimento: "Entretenimento",
  estrutura: "Estrutura",
  fotografia: "Fotografia",
  lembrancinhas: "Lembrancinhas",
  outros: "Outros",
  tempo_adicional: "Tempo adicional",
};

export const additionalBillingTypeLabels: Record<AdditionalBillingType, string> = {
  fixo: "Valor fixo",
  por_hora: "Por hora",
  por_pessoa: "Por pessoa",
  por_unidade: "Por unidade",
};

const STAFF_ADDITIONAL_NAME_PATTERN =
  /garcom|copeir|monitor|recepcionist|seguranc|profissional/;

export const supportsAdditionalQuantitySelection = (
  additional: Pick<Additional, "category" | "name" | "type">,
): boolean => {
  if (additional.type !== "fixo") return true;
  if (additional.category === "equipe") return true;

  const normalized = additional.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return STAFF_ADDITIONAL_NAME_PATTERN.test(normalized);
};

export const buildAdditionalQuantityLabel = (
  additional: Pick<Additional, "category" | "name" | "type">,
): string => {
  if (additional.type === "por_hora") return "Quantidade (horas)";
  if (additional.type === "por_pessoa") return "Quantidade (pessoas)";
  if (supportsAdditionalQuantitySelection(additional)) return "Número de profissionais";
  return "Quantidade";
};

export const parsePackageItems = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
};

export const linesToItems = (text: string): string[] =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

export const itemsToLines = (items: string[] | undefined): string =>
  (items ?? []).join("\n");

export const defaultPackages: PackageData[] = [
  {
    id: "1",
    name: "Pacote Básico",
    description:
      "Ideal para festas íntimas com tudo que seu filho merece. Diversão garantida em um ambiente seguro e decorado com carinho.",
    buffet: {
      salgados: ["Coxinha", "Bolinha de queijo", "Mini pizza"],
      doces: ["Brigadeiro", "Beijinho"],
      bolo: ["Bolo decorado"],
      bebidas: ["Suco natural", "Refrigerante", "Água"],
    },
    estrutura: {
      brinquedos: ["Piscina de bolinhas", "Cama elástica"],
      espaco: ["Salão principal (4h)"],
      decoracao: ["Decoração simples com balões"],
    },
    pricingSchedule: buildPricingSchedule("seg_sex_fds_feriado"),
    pricingTiers: [
      {
        id: "p1-t1",
        minGuests: 1,
        maxGuests: 20,
        bandPrices: { "band-weekdays": 2500, "band-weekend": 3200 },
      },
      {
        id: "p1-t2",
        minGuests: 21,
        maxGuests: 40,
        bandPrices: { "band-weekdays": 3500, "band-weekend": 4400 },
      },
    ],
    equipe: [
      {
        id: "garcom",
        label: "Garçom",
        quantitiesByTier: { "p1-t1": 1, "p1-t2": 2 },
      },
      {
        id: "monitora",
        label: "Monitora",
        quantitiesByTier: { "p1-t1": 1, "p1-t2": 2 },
      },
      {
        id: "limpeza",
        label: "Limpeza",
        quantitiesByTier: { "p1-t1": 1, "p1-t2": 1 },
      },
    ],
  },
  {
    id: "2",
    name: "Pacote Premium",
    description:
      "A festa completa para quem quer surpreender! Buffet temático, equipe dedicada e diversão de sobra para todas as idades.",
    buffet: {
      salgados: ["Coxinha", "Bolinha de queijo", "Mini pizza", "Empada", "Enroladinho"],
      doces: ["Brigadeiro", "Beijinho", "Cajuzinho", "Cupcakes"],
      bolo: ["Bolo temático"],
      bebidas: ["Suco natural", "Refrigerante", "Água", "Chá gelado"],
    },
    estrutura: {
      brinquedos: ["Piscina de bolinhas", "Cama elástica", "Tobogã inflável", "Oficina de slime"],
      espaco: ["Salão principal (5h)", "Área externa"],
      decoracao: ["Decoração temática completa", "Painel de fotos"],
    },
    pricingSchedule: buildPricingSchedule("seg_sex_fds_feriado"),
    pricingTiers: [
      {
        id: "p2-t1",
        minGuests: 1,
        maxGuests: 30,
        bandPrices: { "band-weekdays": 4500, "band-weekend": 5500 },
      },
      {
        id: "p2-t2",
        minGuests: 31,
        maxGuests: 50,
        bandPrices: { "band-weekdays": 5800, "band-weekend": 6900 },
      },
      {
        id: "p2-t3",
        minGuests: 51,
        maxGuests: 70,
        bandPrices: { "band-weekdays": 7000, "band-weekend": 8200 },
      },
    ],
    equipe: [
      {
        id: "garcom",
        label: "Garçom",
        quantitiesByTier: { "p2-t1": 1, "p2-t2": 2, "p2-t3": 2 },
      },
      {
        id: "monitora",
        label: "Monitora",
        quantitiesByTier: { "p2-t1": 1, "p2-t2": 2, "p2-t3": 2 },
      },
      {
        id: "limpeza",
        label: "Limpeza",
        quantitiesByTier: { "p2-t1": 1, "p2-t2": 1, "p2-t3": 2 },
      },
    ],
  },
  {
    id: "3",
    name: "Pacote VIP",
    description:
      "A experiência premium para festas inesquecíveis. Tudo incluso: buffet gourmet, entretenimento profissional, fotografia e muito mais.",
    buffet: {
      salgados: ["Coxinha gourmet", "Bolinha de queijo", "Mini pizza artesanal", "Empada de camarão", "Enroladinho", "Mini hambúrguer"],
      doces: ["Brigadeiro gourmet", "Beijinho", "Cajuzinho", "Cupcakes decorados", "Mesa de doces completa"],
      bolo: ["Bolo designer"],
      bebidas: ["Suco natural premium", "Refrigerante", "Água com gás", "Chá gelado", "Drinks kids"],
    },
    estrutura: {
      brinquedos: ["Piscina de bolinhas", "Cama elástica", "Tobogã inflável", "Oficina de slime", "Just Dance", "Karaokê"],
      espaco: ["Salão principal (6h)", "Área externa", "Espaço lounge pais"],
      decoracao: ["Decoração luxo personalizada", "Painel de fotos", "Balões orgânicos", "Iluminação cênica"],
    },
    pricingSchedule: buildPricingSchedule("seg_sex_fds_feriado"),
    pricingTiers: [
      {
        id: "p3-t1",
        minGuests: 1,
        maxGuests: 40,
        bandPrices: { "band-weekdays": 7000, "band-weekend": 8500 },
      },
      {
        id: "p3-t2",
        minGuests: 41,
        maxGuests: 70,
        bandPrices: { "band-weekdays": 9000, "band-weekend": 10800 },
      },
      {
        id: "p3-t3",
        minGuests: 71,
        maxGuests: 100,
        bandPrices: { "band-weekdays": 11500, "band-weekend": 13500 },
      },
    ],
    equipe: [
      {
        id: "garcom",
        label: "Garçom",
        quantitiesByTier: { "p3-t1": 2, "p3-t2": 3, "p3-t3": 4 },
      },
      {
        id: "monitora",
        label: "Monitora",
        quantitiesByTier: { "p3-t1": 2, "p3-t2": 3, "p3-t3": 4 },
      },
      {
        id: "limpeza",
        label: "Limpeza",
        quantitiesByTier: { "p3-t1": 1, "p3-t2": 2, "p3-t3": 2 },
      },
    ],
  },
];

export const defaultAdditionals: Additional[] = [
  { id: "a1", name: "Convidado extra", price: 80, category: "outros", type: "por_unidade" },
  { id: "a2", name: "Hora extra", price: 500, category: "estrutura", type: "por_unidade" },
  { id: "a3", name: "Fotógrafo profissional", price: 800, category: "entretenimento", type: "fixo" },
  { id: "a4", name: "DJ", price: 600, category: "entretenimento", type: "fixo" },
  { id: "a5", name: "Personagem vivo", price: 450, category: "entretenimento", type: "fixo" },
  { id: "a6", name: "Algodão doce", price: 350, category: "buffet", type: "fixo" },
  { id: "a7", name: "Pipoca gourmet", price: 250, category: "buffet", type: "fixo" },
  { id: "a8", name: "Monitor extra", price: 200, category: "equipe", type: "por_unidade" },
  { id: "a9", name: "Garçom extra", price: 180, category: "equipe", type: "por_unidade" },
  { id: "a10", name: "Pintura facial", price: 300, category: "entretenimento", type: "fixo" },
];
