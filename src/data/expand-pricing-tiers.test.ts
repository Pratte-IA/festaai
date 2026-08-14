import { describe, expect, it } from "vitest";

import {
  collapsePackageGuestPricing,
  expandPackageGuestPricing,
  expandPricingTiersWithInterpolatedGuests,
} from "./expand-pricing-tiers";
import type { PackageData, PricingTier } from "./packagesData";

const anchors: PricingTier[] = [
  {
    id: "t30",
    minGuests: 1,
    maxGuests: 30,
    bandPrices: { "band-weekdays": 3000, "band-weekend": 3600 },
  },
  {
    id: "t40",
    minGuests: 31,
    maxGuests: 40,
    bandPrices: { "band-weekdays": 4000, "band-weekend": 4800 },
  },
  {
    id: "t80",
    minGuests: 71,
    maxGuests: 80,
    bandPrices: { "band-weekdays": 8000, "band-weekend": 8000 },
  },
];

describe("expandPricingTiersWithInterpolatedGuests", () => {
  it("insere 31-39 a partir de 30 e 41-49 a partir de 40", () => {
    const expanded = expandPricingTiersWithInterpolatedGuests(anchors);
    const byGuests = Object.fromEntries(expanded.map((tier) => [tier.maxGuests, tier]));

    expect(byGuests[30]?.bandPrices["band-weekdays"]).toBe(3000);
    expect(byGuests[31]?.bandPrices["band-weekdays"]).toBe(3100);
    expect(byGuests[31]?.interpolated).toBe(true);
    expect(byGuests[39]?.bandPrices["band-weekdays"]).toBe(3900);
    expect(byGuests[40]?.bandPrices["band-weekdays"]).toBe(4000);
    expect(byGuests[40]?.interpolated).toBeUndefined();
    expect(byGuests[41]?.bandPrices["band-weekdays"]).toBe(4100);
    expect(byGuests[85]).toBeUndefined();
    expect(byGuests[80]?.bandPrices["band-weekdays"]).toBe(8000);
  });

  it("e idempotente quando as faixas ja foram expandidas", () => {
    const once = expandPricingTiersWithInterpolatedGuests(anchors);
    const twice = expandPricingTiersWithInterpolatedGuests(once);
    expect(twice).toEqual(once);
  });
});

describe("expandPackageGuestPricing", () => {
  it("copia a equipe da faixa ancora para as faixas interpoladas", () => {
    const pkg = {
      equipe: [
        {
          id: "garcom",
          label: "Garçom",
          quantitiesByTier: { t30: 1, t40: 2, t80: 3 },
        },
      ],
      pricingTiers: anchors,
    } as Pick<PackageData, "equipe" | "pricingTiers">;

    const expanded = expandPackageGuestPricing(pkg);
    const interpolated31 = expanded.pricingTiers.find((tier) => tier.maxGuests === 31);

    expect(interpolated31).toBeDefined();
    expect(expanded.equipe[0].quantitiesByTier[interpolated31!.id]).toBe(1);
    expect(expanded.equipe[0].quantitiesByTier.t40).toBe(2);
  });

  it("colapsa de volta para as faixas cadastradas pelo tenant", () => {
    const pkg = {
      equipe: [
        {
          id: "garcom",
          label: "Garçom",
          quantitiesByTier: { t30: 1, t40: 2, t80: 3 },
        },
      ],
      pricingTiers: anchors,
    } as Pick<PackageData, "equipe" | "pricingTiers">;

    const collapsed = collapsePackageGuestPricing(expandPackageGuestPricing(pkg));
    expect(collapsed.pricingTiers.map((tier) => tier.maxGuests)).toEqual([30, 40, 80]);
    expect(collapsed.equipe[0].quantitiesByTier).toEqual({ t30: 1, t40: 2, t80: 3 });
  });
});
