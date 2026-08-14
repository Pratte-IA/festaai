import type { EquipeBlock, PackageData, PricingTier } from "@/data/packagesData";
import { syncEquipeWithTiers } from "@/data/packagesData";

export const INTERPOLATED_TIER_ID_PREFIX = "interp-";

const roundCurrency = (value: number) => Math.round(value * 100) / 100;

export const buildInterpolatedTierId = (anchorId: string, guestCount: number): string =>
  `${INTERPOLATED_TIER_ID_PREFIX}${anchorId}-${guestCount}`;

export const isInterpolatedPricingTier = (tier: Pick<PricingTier, "id" | "interpolated">): boolean =>
  tier.interpolated === true || tier.id.startsWith(INTERPOLATED_TIER_ID_PREFIX);

export const scaleBandPrices = (
  bandPrices: Record<string, number>,
  fromGuests: number,
  toGuests: number,
): Record<string, number> => {
  if (fromGuests <= 0) return { ...bandPrices };

  const factor = toGuests / fromGuests;
  return Object.fromEntries(
    Object.entries(bandPrices).map(([bandId, price]) => [bandId, roundCurrency(price * factor)]),
  );
};

export const collapsePricingTiersToAnchors = (tiers: PricingTier[]): PricingTier[] =>
  [...tiers]
    .filter((tier) => !isInterpolatedPricingTier(tier))
    .sort((a, b) => a.maxGuests - b.maxGuests);

export const expandPricingTiersWithInterpolatedGuests = (tiers: PricingTier[]): PricingTier[] => {
  const anchors = collapsePricingTiersToAnchors(tiers);
  if (anchors.length === 0) return [];

  const expanded: PricingTier[] = [];

  for (let index = 0; index < anchors.length; index += 1) {
    const current = anchors[index];
    expanded.push({
      bandPrices: { ...current.bandPrices },
      id: current.id,
      maxGuests: current.maxGuests,
      minGuests: current.minGuests,
    });

    const next = anchors[index + 1];
    if (!next) continue;

    const fromGuests = current.maxGuests;
    const toGuests = next.maxGuests;
    if (fromGuests <= 0 || toGuests <= fromGuests + 1) continue;

    for (let guestCount = fromGuests + 1; guestCount < toGuests; guestCount += 1) {
      expanded.push({
        bandPrices: scaleBandPrices(current.bandPrices, fromGuests, guestCount),
        id: buildInterpolatedTierId(current.id, guestCount),
        interpolated: true,
        maxGuests: guestCount,
        minGuests: guestCount,
      });
    }
  }

  return expanded;
};

const resolveAnchorIdFromInterpolatedTier = (
  tier: PricingTier,
  anchors: PricingTier[],
): string | null => {
  const match = anchors.find((anchor) =>
    tier.id.startsWith(`${INTERPOLATED_TIER_ID_PREFIX}${anchor.id}-`),
  );
  return match?.id ?? null;
};

export const expandEquipeForPricingTiers = (
  equipe: EquipeBlock,
  expandedTiers: PricingTier[],
): EquipeBlock => {
  const anchors = collapsePricingTiersToAnchors(expandedTiers);
  const expandedIds = new Set(expandedTiers.map((tier) => tier.id));

  return equipe.map((role) => {
    const quantitiesByTier = { ...role.quantitiesByTier };

    for (const tier of expandedTiers) {
      if (!isInterpolatedPricingTier(tier) || tier.id in quantitiesByTier) continue;
      const anchorId = resolveAnchorIdFromInterpolatedTier(tier, anchors);
      quantitiesByTier[tier.id] = anchorId != null ? (quantitiesByTier[anchorId] ?? 0) : 0;
    }

    for (const tierId of Object.keys(quantitiesByTier)) {
      if (!expandedIds.has(tierId)) delete quantitiesByTier[tierId];
    }

    return { ...role, quantitiesByTier };
  });
};

export const expandPackageGuestPricing = <T extends Pick<PackageData, "equipe" | "pricingTiers">>(
  pkg: T,
): T => {
  const pricingTiers = expandPricingTiersWithInterpolatedGuests(pkg.pricingTiers);
  return {
    ...pkg,
    equipe: expandEquipeForPricingTiers(pkg.equipe, pricingTiers),
    pricingTiers,
  };
};

export const collapsePackageGuestPricing = <T extends Pick<PackageData, "equipe" | "pricingTiers">>(
  pkg: T,
): T => {
  const pricingTiers = collapsePricingTiersToAnchors(pkg.pricingTiers);
  return {
    ...pkg,
    equipe: syncEquipeWithTiers(pkg.equipe, pricingTiers),
    pricingTiers,
  };
};
