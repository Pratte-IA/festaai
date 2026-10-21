import type { PricingTier } from "@/data/packagesData";
import { parseIsoDateString } from "@/data/brazilian-holidays";
import {
  remapTierBandPrices,
  type PricingBand,
} from "@/data/pricing-schedule";

export interface ResolvedTierBandPrices {
  appliedYear: number | null;
  bandPrices: Record<string, number>;
  requestedYear: number | null;
  usedFallback: boolean;
}

export interface PackagePriceYearNotice {
  message: string;
  usedFallback: boolean;
}

const isPriceYear = (year: number): boolean =>
  Number.isInteger(year) && year >= 2000 && year <= 2100;

export const readIsoDateYear = (dateStr: string | null | undefined): number | null => {
  if (!dateStr?.trim()) return null;
  const parts = parseIsoDateString(dateStr);
  return parts && isPriceYear(parts.year) ? parts.year : null;
};

export const collectPackagePriceYears = (tiers: PricingTier[]): number[] => {
  const years = new Set<number>();

  for (const tier of tiers) {
    for (const yearKey of Object.keys(tier.bandPricesByYear ?? {})) {
      const year = Number(yearKey);
      if (isPriceYear(year)) years.add(year);
    }
  }

  return [...years].sort((left, right) => left - right);
};

/** Ano vigente e o seguinte, mais qualquer ano já gravado na tabela. */
export const listEditablePriceYears = (tiers: PricingTier[], now = new Date()): number[] => {
  const current = now.getFullYear();
  return [...new Set([current, current + 1, ...collectPackagePriceYears(tiers)])].sort(
    (left, right) => left - right,
  );
};

export const isPackageYearExplicit = (tiers: PricingTier[], year: number): boolean =>
  tiers.some((tier) => tier.bandPricesByYear?.[String(year)] != null);

export const readTierBandPricesForYear = (
  tier: PricingTier,
  year: number,
): Record<string, number> => tier.bandPricesByYear?.[String(year)] ?? tier.bandPrices;

const cloneYearMap = (
  bandPricesByYear: PricingTier["bandPricesByYear"],
): Record<string, Record<string, number>> =>
  Object.fromEntries(
    Object.entries(bandPricesByYear ?? {}).map(([year, prices]) => [year, { ...prices }]),
  );

const pickFallbackYear = (configured: number[], target: number): number => {
  const sorted = [...configured].sort((left, right) => left - right);
  const atOrBefore = sorted.filter((year) => year <= target);
  return atOrBefore.length > 0 ? atOrBefore[atOrBefore.length - 1] : sorted[0];
};

/**
 * Escolhe a tabela do ano da festa.
 * Sem mapa por ano, `bandPrices` vale para qualquer data.
 * Sem tabela daquele ano, usa o ano cadastrado mais recente que já começou
 * (ou o primeiro cadastrado, se a festa for anterior a todos).
 */
export const resolveTierBandPricesForDate = (
  tier: PricingTier,
  eventDate?: string | null,
  catalogYears: number[] = collectPackagePriceYears([tier]),
  now: Date = new Date(),
): ResolvedTierBandPrices => {
  const configured = catalogYears.filter(isPriceYear);
  const requestedYear = readIsoDateYear(eventDate);

  if (configured.length === 0) {
    return {
      appliedYear: null,
      bandPrices: tier.bandPrices,
      requestedYear,
      usedFallback: false,
    };
  }

  const priceFor = (year: number): Record<string, number> =>
    tier.bandPricesByYear?.[String(year)] ?? tier.bandPrices;

  if (requestedYear == null) {
    const current = now.getFullYear();
    const appliedYear = configured.includes(current) ? current : pickFallbackYear(configured, current);
    return {
      appliedYear,
      bandPrices: priceFor(appliedYear),
      requestedYear: null,
      usedFallback: false,
    };
  }

  if (configured.includes(requestedYear)) {
    return {
      appliedYear: requestedYear,
      bandPrices: priceFor(requestedYear),
      requestedYear,
      usedFallback: false,
    };
  }

  const appliedYear = pickFallbackYear(configured, requestedYear);
  return {
    appliedYear,
    bandPrices: priceFor(appliedYear),
    requestedYear,
    usedFallback: true,
  };
};

export const describePackagePriceYear = (
  tiers: PricingTier[],
  eventDate?: string | null,
  now: Date = new Date(),
): PackagePriceYearNotice | null => {
  const years = collectPackagePriceYears(tiers);
  if (years.length === 0) return null;

  const reference = tiers.find((tier) => tier.bandPricesByYear) ?? tiers[0];
  if (!reference) return null;

  const resolved = resolveTierBandPricesForDate(reference, eventDate, years, now);

  if (!eventDate?.trim()) {
    const year = resolved.appliedYear ?? now.getFullYear();
    return {
      message: `Sem a data da festa, o valor usa a tabela de ${year}.`,
      usedFallback: false,
    };
  }

  if (resolved.usedFallback && resolved.requestedYear != null && resolved.appliedYear != null) {
    return {
      message: `Não há tabela de ${resolved.requestedYear}. O valor usa a tabela de ${resolved.appliedYear}.`,
      usedFallback: true,
    };
  }

  if (resolved.appliedYear != null) {
    return {
      message: `Tabela de ${resolved.appliedYear}.`,
      usedFallback: false,
    };
  }

  return null;
};

export const setTierBandPriceForYear = (
  tier: PricingTier,
  year: number,
  bandId: string,
  price: number,
  referenceYear: number,
): PricingTier => {
  const safePrice = Math.max(0, Number.isFinite(price) ? price : 0);
  const hasExplicitYears = Object.keys(tier.bandPricesByYear ?? {}).length > 0;

  if (!hasExplicitYears && year === referenceYear) {
    return {
      ...tier,
      bandPrices: { ...tier.bandPrices, [bandId]: safePrice },
    };
  }

  const bandPricesByYear = cloneYearMap(tier.bandPricesByYear);
  if (!bandPricesByYear[String(referenceYear)]) {
    bandPricesByYear[String(referenceYear)] = { ...tier.bandPrices };
  }

  const displayed = bandPricesByYear[String(year)]
    ? { ...bandPricesByYear[String(year)] }
    : { ...tier.bandPrices };
  displayed[bandId] = safePrice;
  bandPricesByYear[String(year)] = displayed;

  return {
    ...tier,
    bandPrices: { ...(bandPricesByYear[String(referenceYear)] ?? tier.bandPrices) },
    bandPricesByYear,
  };
};

export const copyTierYearPrices = (
  tier: PricingTier,
  fromYear: number,
  toYear: number,
  referenceYear: number,
): PricingTier => {
  if (fromYear === toYear) return tier;

  const bandPricesByYear = cloneYearMap(tier.bandPricesByYear);
  if (!bandPricesByYear[String(referenceYear)]) {
    bandPricesByYear[String(referenceYear)] = { ...tier.bandPrices };
  }

  bandPricesByYear[String(toYear)] = { ...readTierBandPricesForYear(tier, fromYear) };

  return {
    ...tier,
    bandPrices: { ...(bandPricesByYear[String(referenceYear)] ?? tier.bandPrices) },
    bandPricesByYear,
  };
};

/** Remove a tabela do ano para ela voltar a acompanhar os valores base. */
export const clearTierYearPrices = (
  tier: PricingTier,
  year: number,
  referenceYear: number,
): PricingTier => {
  if (year === referenceYear || !tier.bandPricesByYear?.[String(year)]) return tier;

  const remaining = cloneYearMap(tier.bandPricesByYear);
  delete remaining[String(year)];
  const keys = Object.keys(remaining);

  if (keys.length === 0 || (keys.length === 1 && keys[0] === String(referenceYear))) {
    const bandPrices = remaining[String(referenceYear)]
      ? { ...remaining[String(referenceYear)] }
      : { ...tier.bandPrices };
    return { ...tier, bandPrices, bandPricesByYear: undefined };
  }

  return {
    ...tier,
    bandPrices: remaining[String(referenceYear)]
      ? { ...remaining[String(referenceYear)] }
      : { ...tier.bandPrices },
    bandPricesByYear: remaining,
  };
};

export const remapTierPricesForSchedule = (
  tier: PricingTier,
  oldBands: PricingBand[],
  newBands: PricingBand[],
): PricingTier => {
  const bandPrices = remapTierBandPrices(tier.bandPrices, oldBands, newBands);
  if (!tier.bandPricesByYear) return { ...tier, bandPrices };

  return {
    ...tier,
    bandPrices,
    bandPricesByYear: Object.fromEntries(
      Object.entries(tier.bandPricesByYear).map(([year, prices]) => [
        year,
        remapTierBandPrices(prices, oldBands, newBands),
      ]),
    ),
  };
};

/** Mantém `bandPrices` igual à tabela do ano civil de referência, para leitores antigos. */
export const alignPackageBandPricesToCalendarYear = (
  tiers: PricingTier[],
  referenceYear = new Date().getFullYear(),
): PricingTier[] =>
  tiers.map((tier) => {
    const yearPrices = tier.bandPricesByYear?.[String(referenceYear)];
    if (!yearPrices) return tier;
    return { ...tier, bandPrices: { ...yearPrices } };
  });
