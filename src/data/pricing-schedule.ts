/** 0 = domingo … 6 = sábado (padrão JavaScript Date.getDay). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  0: "Dom",
  1: "Seg",
  2: "Ter",
  3: "Qua",
  4: "Qui",
  5: "Sex",
  6: "Sáb",
};

export interface PricingBand {
  id: string;
  label: string;
  days: Weekday[];
  /** Se true, feriados usam o preço desta faixa. */
  includesHolidays: boolean;
}

/** Quando nenhuma faixa cobre feriados explicitamente. */
export type HolidayPolicy = "weekday_band" | "weekend_band";

export interface PricingSchedule {
  presetId: PricingSchedulePresetId;
  bands: PricingBand[];
  holidayPolicy: HolidayPolicy;
}

export type PricingSchedulePresetId =
  | "seg_qui_fds_feriado"
  | "seg_sex_fds_feriado"
  | "seg_sex_fds_sem_feriado";

export interface PricingSchedulePresetOption {
  id: PricingSchedulePresetId;
  title: string;
  description: string;
}

export const PRICING_SCHEDULE_PRESETS: PricingSchedulePresetOption[] = [
  {
    id: "seg_qui_fds_feriado",
    title: "Segunda a quinta / Sexta, sábado, domingo e feriados",
    description: "Dias úteis até quinta em um valor; fim de semana prolongado e feriados em outro.",
  },
  {
    id: "seg_sex_fds_feriado",
    title: "Segunda a sexta / Sábado, domingo e feriados",
    description: "Semana completa em um valor; sábado, domingo e feriados em outro.",
  },
  {
    id: "seg_sex_fds_sem_feriado",
    title: "Segunda a sexta / Sábado e domingo (sem feriado)",
    description: "Feriados seguem o preço de segunda a sexta, sem tarifa especial.",
  },
];

const createBand = (
  id: string,
  label: string,
  days: Weekday[],
  includesHolidays: boolean,
): PricingBand => ({ id, label, days, includesHolidays });

export const buildPricingSchedule = (presetId: PricingSchedulePresetId): PricingSchedule => {
  switch (presetId) {
    case "seg_qui_fds_feriado":
      return {
        presetId,
        holidayPolicy: "weekend_band",
        bands: [
          createBand("band-weekdays", "Segunda a quinta", [1, 2, 3, 4], false),
          createBand("band-weekend", "Sex, sáb, dom e feriados", [5, 6, 0], true),
        ],
      };
    case "seg_sex_fds_feriado":
      return {
        presetId,
        holidayPolicy: "weekend_band",
        bands: [
          createBand("band-weekdays", "Segunda a sexta", [1, 2, 3, 4, 5], false),
          createBand("band-weekend", "Sáb, dom e feriados", [6, 0], true),
        ],
      };
    case "seg_sex_fds_sem_feriado":
      return {
        presetId,
        holidayPolicy: "weekday_band",
        bands: [
          createBand("band-weekdays", "Segunda a sexta", [1, 2, 3, 4, 5], false),
          createBand("band-weekend", "Sábado e domingo", [6, 0], false),
        ],
      };
    default:
      return buildPricingSchedule("seg_sex_fds_feriado");
  }
};

export const DEFAULT_PRICING_SCHEDULE = buildPricingSchedule("seg_sex_fds_feriado");

export const formatBandDays = (band: PricingBand): string => {
  const sorted = [...band.days].sort((a, b) => {
    const order = (d: Weekday) => (d === 0 ? 7 : d);
    return order(a) - order(b);
  });
  return sorted.map((d) => WEEKDAY_LABELS[d]).join(", ");
};

export const remapTierBandPrices = (
  bandPrices: Record<string, number>,
  oldBands: PricingBand[],
  newBands: PricingBand[],
): Record<string, number> => {
  const next: Record<string, number> = {};

  newBands.forEach((band, index) => {
    const legacyBand = oldBands[index];
    next[band.id] =
      bandPrices[band.id] ??
      (legacyBand ? bandPrices[legacyBand.id] : undefined) ??
      0;
  });

  return next;
};

export const createEmptyBandPrices = (bands: PricingBand[]): Record<string, number> =>
  Object.fromEntries(bands.map((band) => [band.id, 0]));

export const getTierBandPrice = (
  bandPrices: Record<string, number>,
  bandId: string,
): number => Math.max(0, bandPrices[bandId] ?? 0);

export const getTierMinBandPrice = (bandPrices: Record<string, number>): number => {
  const values = Object.values(bandPrices).map((v) => Math.max(0, Number(v) || 0));
  return values.length > 0 ? Math.min(...values) : 0;
};

/** Payload salvo em `tenant_packages.pricing_tiers` (novo formato). */
export interface PricingTiersPayload {
  schedule: PricingSchedule;
  tiers: unknown[];
}

export const isPricingTiersPayload = (raw: unknown): raw is PricingTiersPayload =>
  typeof raw === "object" &&
  raw !== null &&
  !Array.isArray(raw) &&
  "tiers" in raw &&
  Array.isArray((raw as PricingTiersPayload).tiers);

export const normalizePricingSchedule = (raw: unknown): PricingSchedule => {
  if (typeof raw !== "object" || raw === null) {
    return DEFAULT_PRICING_SCHEDULE;
  }

  const data = raw as Record<string, unknown>;
  const presetId = data.presetId as PricingSchedulePresetId | undefined;
  const base =
    presetId && PRICING_SCHEDULE_PRESETS.some((p) => p.id === presetId)
      ? buildPricingSchedule(presetId)
      : DEFAULT_PRICING_SCHEDULE;

  if (!Array.isArray(data.bands)) {
    return base;
  }

  const bands = data.bands
    .filter((b): b is Record<string, unknown> => typeof b === "object" && b !== null)
    .map((band, index) => ({
      id: typeof band.id === "string" && band.id ? band.id : `band-${index}`,
      label: typeof band.label === "string" ? band.label.trim() : `Faixa ${index + 1}`,
      days: Array.isArray(band.days)
        ? (band.days.map(Number).filter((d) => d >= 0 && d <= 6) as Weekday[])
        : [],
      includesHolidays: Boolean(band.includesHolidays),
    }))
    .filter((band) => band.label.length > 0 && band.days.length > 0);

  const holidayPolicy: HolidayPolicy =
    data.holidayPolicy === "weekday_band" ? "weekday_band" : "weekend_band";

  if (bands.length === 0) {
    return base;
  }

  return {
    presetId: presetId ?? base.presetId,
    bands,
    holidayPolicy,
  };
};
