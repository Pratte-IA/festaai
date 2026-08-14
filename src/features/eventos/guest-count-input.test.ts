import { describe, expect, it } from "vitest";

import type { PackageData } from "@/data/packagesData";

import {
  buildGuestCountOptions,
  normalizeGuestCountValue,
  resolveMaxGuestCount,
  resolveMinGuestCount,
  validateGuestCountValue,
} from "./guest-count-input";

const packageFixture = (maxGuests: number, minGuests = 1): PackageData =>
  ({
    active: true,
    description: "",
    id: "1",
    name: "Pacote",
    pricingSchedule: { bands: [], holidayPolicy: "weekend_band", presetId: "test" },
    pricingTiers: [{ id: "t1", maxGuests, minGuests, bandPrices: {} }],
  }) as PackageData;

describe("guest-count-input", () => {
  it("limita convidados pela capacidade real do salao", () => {
    expect(resolveMaxGuestCount(125, [])).toBe(125);
    expect(buildGuestCountOptions(12, 10)).toEqual([10, 11, 12]);
  });

  it("usa o menor limite entre salao e pacotes", () => {
    expect(resolveMaxGuestCount(200, [packageFixture(80)])).toBe(80);
  });

  it("parte da menor faixa cadastrada nos pacotes", () => {
    expect(resolveMinGuestCount([packageFixture(80, 30)])).toBe(30);
  });

  it("mantem a quantidade digitada e respeita o teto do salao", () => {
    expect(normalizeGuestCountValue("37", 120)).toBe("37");
    expect(normalizeGuestCountValue("125", 120)).toBe("120");
  });

  it("valida quantidade inteira e teto do salao", () => {
    expect(validateGuestCountValue("25", 120)).toBeNull();
    expect(validateGuestCountValue("31", 120)).toBeNull();
    expect(validateGuestCountValue("130", 120)).toBe(
      "A capacidade máxima do salão é de 120 convidados.",
    );
    expect(validateGuestCountValue("80", 120)).toBeNull();
  });
});
