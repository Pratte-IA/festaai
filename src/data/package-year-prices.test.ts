import { describe, expect, it } from "vitest";

import { normalizePackagePricing, serializePackagePricing, type PricingTier } from "@/data/packagesData";
import { buildPricingSchedule } from "@/data/pricing-schedule";
import {
  clearTierYearPrices,
  copyTierYearPrices,
  describePackagePriceYear,
  resolveTierBandPricesForDate,
  setTierBandPriceForYear,
} from "@/data/package-year-prices";

const tier = (patch?: Partial<PricingTier>): PricingTier => ({
  id: "t30",
  minGuests: 1,
  maxGuests: 30,
  bandPrices: { "band-weekdays": 3000, "band-weekend": 3600 },
  ...patch,
});

describe("resolveTierBandPricesForDate", () => {
  const priced = tier({
    bandPricesByYear: {
      "2026": { "band-weekdays": 3000, "band-weekend": 3600 },
      "2027": { "band-weekdays": 3300, "band-weekend": 4000 },
    },
  });

  it("mantem a tabela unica quando nao ha ano explicito", () => {
    const resolved = resolveTierBandPricesForDate(tier(), "2028-05-02", [], new Date(2026, 9, 21));
    expect(resolved.bandPrices["band-weekend"]).toBe(3600);
    expect(resolved.usedFallback).toBe(false);
    expect(resolved.appliedYear).toBeNull();
  });

  it("escolhe o ano da data e avisa quando o ano ainda nao foi cadastrado", () => {
    const exact = resolveTierBandPricesForDate(priced, "2027-06-12", [2026, 2027]);
    const future = resolveTierBandPricesForDate(priced, "2028-06-12", [2026, 2027]);
    const past = resolveTierBandPricesForDate(priced, "2025-06-12", [2026, 2027]);

    expect(exact.appliedYear).toBe(2027);
    expect(exact.usedFallback).toBe(false);
    expect(exact.bandPrices["band-weekend"]).toBe(4000);
    expect(future.appliedYear).toBe(2027);
    expect(future.usedFallback).toBe(true);
    expect(past.appliedYear).toBe(2026);
    expect(past.usedFallback).toBe(true);
  });

  it("sem data usa o ano vigente", () => {
    const resolved = resolveTierBandPricesForDate(priced, null, [2026, 2027], new Date(2026, 9, 21));
    expect(resolved.appliedYear).toBe(2026);
    expect(resolved.bandPrices["band-weekdays"]).toBe(3000);
    expect(describePackagePriceYear([priced], null, new Date(2026, 9, 21))?.message).toBe(
      "Sem a data da festa, o valor usa a tabela de 2026.",
    );
    expect(describePackagePriceYear([priced], "2028-01-01")?.usedFallback).toBe(true);
  });
});

describe("edicao da tabela por ano", () => {
  it("separa o proximo ano sem alterar o vigente", () => {
    const next = setTierBandPriceForYear(tier(), 2027, "band-weekdays", 3300, 2026);
    expect(next.bandPrices["band-weekdays"]).toBe(3000);
    expect(next.bandPricesByYear?.["2026"]["band-weekdays"]).toBe(3000);
    expect(next.bandPricesByYear?.["2027"]["band-weekdays"]).toBe(3300);

    const updatedCurrent = setTierBandPriceForYear(next, 2026, "band-weekdays", 3100, 2026);
    expect(updatedCurrent.bandPrices["band-weekdays"]).toBe(3100);
    expect(updatedCurrent.bandPricesByYear?.["2027"]["band-weekdays"]).toBe(3300);
  });

  it("copiar e voltar a acompanhar o ano vigente", () => {
    const copied = copyTierYearPrices(tier(), 2026, 2027, 2026);
    expect(copied.bandPricesByYear?.["2027"]["band-weekend"]).toBe(3600);

    const cleared = clearTierYearPrices(copied, 2027, 2026);
    expect(cleared.bandPricesByYear).toBeUndefined();
    expect(cleared.bandPrices["band-weekdays"]).toBe(3000);
  });

  it("normaliza e grava o ano vigente em bandPrices", () => {
    const schedule = buildPricingSchedule("seg_sex_fds_feriado");
    const normalized = normalizePackagePricing({
      schedule,
      tiers: [
        {
          id: "t30",
          minGuests: 1,
          maxGuests: 30,
          bandPrices: { "band-weekdays": 1, "band-weekend": 1 },
          bandPricesByYear: {
            "2026": { "band-weekdays": 3000, "band-weekend": 3600 },
            "2027": { "band-weekdays": 3300, "band-weekend": 4000 },
          },
        },
      ],
    });

    expect(normalized.tiers[0].bandPricesByYear?.["2027"]["band-weekend"]).toBe(4000);

    const referenceYear = new Date().getFullYear();
    const serialized = serializePackagePricing(schedule, normalized.tiers);
    const saved = serialized.tiers[0] as PricingTier;
    expect(saved.bandPrices["band-weekdays"]).toBe(
      saved.bandPricesByYear?.[String(referenceYear)]["band-weekdays"],
    );
  });
});
