import type { PackageData } from "@/data/packagesData";

export const GUEST_COUNT_STEP = 10;

export const snapGuestCountDownToStep = (value: number): number => {
  if (!Number.isFinite(value) || value <= 0) return GUEST_COUNT_STEP;
  return Math.max(GUEST_COUNT_STEP, Math.floor(value / GUEST_COUNT_STEP) * GUEST_COUNT_STEP);
};

export const snapGuestCountToStep = (value: number): number => {
  if (!Number.isFinite(value) || value <= 0) return GUEST_COUNT_STEP;
  return Math.max(GUEST_COUNT_STEP, Math.round(value / GUEST_COUNT_STEP) * GUEST_COUNT_STEP);
};

export const resolveMaxGuestsFromPackages = (packages: PackageData[]): number | null => {
  let max = 0;

  packages.forEach((pkg) => {
    pkg.pricingTiers.forEach((tier) => {
      if (tier.maxGuests > max) max = tier.maxGuests;
    });
  });

  return max > 0 ? snapGuestCountDownToStep(max) : null;
};

export const resolveMaxGuestCount = (
  venueCapacity: number | null | undefined,
  packages: PackageData[],
): number | null => {
  const venueMax =
    venueCapacity != null && venueCapacity > 0 ? snapGuestCountDownToStep(venueCapacity) : null;
  const packageMax = resolveMaxGuestsFromPackages(packages);

  if (venueMax != null && packageMax != null) return Math.min(venueMax, packageMax);
  return venueMax ?? packageMax;
};

export const buildGuestCountOptions = (maxGuestCount: number | null): number[] => {
  const max = maxGuestCount != null && maxGuestCount >= GUEST_COUNT_STEP ? maxGuestCount : 200;
  const options: number[] = [];

  for (let count = GUEST_COUNT_STEP; count <= max; count += GUEST_COUNT_STEP) {
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

  const snapped = snapGuestCountToStep(Number(digits));
  if (maxGuestCount != null && maxGuestCount > 0) {
    return String(Math.min(snapped, maxGuestCount));
  }

  return String(snapped);
};

export const validateGuestCountValue = (
  rawValue: string,
  maxGuestCount: number | null,
): string | null => {
  const trimmed = rawValue.trim();
  if (!trimmed) return "Este campo é obrigatório.";

  const count = Number(trimmed);
  if (!Number.isFinite(count) || count <= 0) {
    return "Informe uma quantidade válida de convidados.";
  }

  if (count % GUEST_COUNT_STEP !== 0) {
    return `Informe a quantidade de convidados de ${GUEST_COUNT_STEP} em ${GUEST_COUNT_STEP}.`;
  }

  if (maxGuestCount != null && maxGuestCount > 0 && count > maxGuestCount) {
    return `A capacidade máxima do salão é de ${maxGuestCount} convidados.`;
  }

  return null;
};

export const buildGuestCountHelperText = (maxGuestCount: number | null): string => {
  if (maxGuestCount != null && maxGuestCount > 0) {
    return `Selecione de ${GUEST_COUNT_STEP} em ${GUEST_COUNT_STEP} convidados, até o máximo de ${maxGuestCount} pessoas (capacidade do salão).`;
  }

  return `Selecione a quantidade de convidados de ${GUEST_COUNT_STEP} em ${GUEST_COUNT_STEP}.`;
};
