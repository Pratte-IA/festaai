import { describe, expect, it } from "vitest";

import type { PackageData } from "@/data/packagesData";

import {
  buildGuestCountOptions,
  normalizeGuestCountValue,
  resolveMaxGuestCount,
  validateGuestCountValue,
} from "./guest-count-input";

const packageFixture = (maxGuests: number): PackageData =>
  ({
    active: true,
    description: "",
    id: "1",
    name: "Pacote",
    pricingSchedule: { bands: [], holidayPolicy: "weekend_band", presetId: "test" },
    pricingTiers: [{ id: "t1", maxGuests, minGuests: 1, bandPrices: {} }],
  }) as PackageData;

describe("guest-count-input", () => {
  it("limita convidados pela capacidade do salao em degraus de 10", () => {
    expect(resolveMaxGuestCount(125, [])).toBe(120);
    expect(buildGuestCountOptions(120)).toEqual([10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120]);
  });

  it("usa o menor limite entre salao e pacotes", () => {
    expect(resolveMaxGuestCount(200, [packageFixture(80)])).toBe(80);
  });

  it("normaliza digitacao para multiplos de 10", () => {
    expect(normalizeGuestCountValue("37", 120)).toBe("40");
    expect(normalizeGuestCountValue("125", 120)).toBe("120");
  });

  it("valida multiplos de 10 e teto do salao", () => {
    expect(validateGuestCountValue("25", 120)).toBe(
      "Informe a quantidade de convidados de 10 em 10.",
    );
    expect(validateGuestCountValue("130", 120)).toBe(
      "A capacidade máxima do salão é de 120 convidados.",
    );
    expect(validateGuestCountValue("80", 120)).toBeNull();
  });
});
