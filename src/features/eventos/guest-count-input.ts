import type { PackageData } from "@/data/packagesData";
import { isInterpolatedPricingTier } from "@/data/expand-pricing-tiers";

const DEFAULT_MAX_GUEST_COUNT = 200;

export const resolveMaxGuestsFromPackages = (packages: PackageData[]): number | null => {
  let max = 0;

  packages.forEach((pkg) => {
    pkg.pricingTiers.forEach((tier) => {
      if (tier.maxGuests > max) max = tier.maxGuests;
    });
  });

  return max > 0 ? max : null;
};

export const resolveMinGuestCount = (packages: PackageData[]): number => {
  let min = Number.POSITIVE_INFINITY;

  packages.forEach((pkg) => {
    pkg.pricingTiers.forEach((tier) => {
      if (isInterpolatedPricingTier(tier)) return;
      if (tier.minGuests > 0 && tier.minGuests < min) min = tier.minGuests;
    });
  });

  return Number.isFinite(min) ? min : 1;
};

export const resolveMaxGuestCount = (
  venueCapacity: number | null | undefined,
  packages: PackageData[],
): number | null => {
  const venueMax = venueCapacity != null && venueCapacity > 0 ? venueCapacity : null;
  const packageMax = resolveMaxGuestsFromPackages(packages);

  if (venueMax != null && packageMax != null) return Math.min(venueMax, packageMax);
  return venueMax ?? packageMax;
};

export const buildGuestCountOptions = (
  maxGuestCount: number | null,
  minGuestCount = 1,
): number[] => {
  const max =
    maxGuestCount != null && maxGuestCount >= 1 ? maxGuestCount : DEFAULT_MAX_GUEST_COUNT;
  const min = Math.max(1, minGuestCount);
  const start = Math.min(min, max);
  const options: number[] = [];

  for (let count = start; count <= max; count += 1) {
    options.push(count);
  }

  return options;
};

export const normalizeGuestCountValue = (
  rawValue: string,
  maxGuestCount: number | null,
): string => {
  const digits = rawValue.replace(/\D/g, "");
  if (!digits) return "";

  const count = Number(digits);
  if (!Number.isFinite(count) || count <= 0) return "";

  if (maxGuestCount != null && maxGuestCount > 0) {
    return String(Math.min(count, maxGuestCount));
  }

  return String(count);
};

export const validateGuestCountValue = (
  rawValue: string,
  maxGuestCount: number | null,
): string | null => {
  const trimmed = rawValue.trim();
  if (!trimmed) return "Este campo é obrigatório.";

  const count = Number(trimmed);
  if (!Number.isFinite(count) || count <= 0 || !Number.isInteger(count)) {
    return "Informe uma quantidade válida de convidados.";
  }

  if (maxGuestCount != null && maxGuestCount > 0 && count > maxGuestCount) {
    return `A capacidade máxima do salão é de ${maxGuestCount} convidados.`;
  }

  return null;
};

export const buildGuestCountHelperText = (maxGuestCount: number | null): string => {
  if (maxGuestCount != null && maxGuestCount > 0) {
    return `Selecione a quantidade de convidados, até o máximo de ${maxGuestCount} pessoas (capacidade do salão). Quantidades entre as faixas da tabela (ex.: 31 a 39) usam o valor da faixa anterior, proporcional por pessoa.`;
  }

  return "Selecione a quantidade de convidados. Quantidades entre as faixas da tabela (ex.: 31 a 39) usam o valor da faixa anterior, proporcional por pessoa.";
};
