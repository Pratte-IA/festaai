import { describe, expect, it } from "vitest";

import { getPackagePriceForGuests } from "./closing-form-runtime";
import type { PackageData } from "@/data/packagesData";

const cafeColonial = {
  id: "7",
  name: "Pacote Café Colonial",
  pricingSchedule: {
    presetId: "seg_sex_fds_feriado",
    holidayPolicy: "weekend_band",
    bands: [
      { id: "band-weekdays", label: "Segunda a sexta", days: [1, 2, 3, 4, 5], includesHolidays: false },
      { id: "band-weekend", label: "Sáb, dom e feriados", days: [6, 0], includesHolidays: true },
    ],
  },
  pricingTiers: [
    { id: "t80", minGuests: 71, maxGuests: 80, bandPrices: { "band-weekdays": 9362.18, "band-weekend": 9362.18 } },
    { id: "t90", minGuests: 81, maxGuests: 90, bandPrices: { "band-weekdays": 10213.85, "band-weekend": 10213.85 } },
  ],
} as unknown as PackageData;

describe("getPackagePriceForGuests", () => {
  it("usa a faixa de convidados correta em todos os pacotes com tabela", () => {
    expect(getPackagePriceForGuests(cafeColonial, 80, "2026-07-10")).toBe(9362.18);
    expect(getPackagePriceForGuests(cafeColonial, 85, "2026-07-10")).toBe(9947.32);
    expect(getPackagePriceForGuests(cafeColonial, 90, "2026-07-10")).toBe(10213.85);
  });

  it("interpola quantidades intermediarias a partir da faixa inferior", () => {
    const pkg = {
      id: "1",
      pricingSchedule: cafeColonial.pricingSchedule,
      pricingTiers: [
        { id: "t30", minGuests: 21, maxGuests: 30, bandPrices: { "band-weekdays": 3000, "band-weekend": 3000 } },
        { id: "t40", minGuests: 31, maxGuests: 40, bandPrices: { "band-weekdays": 4000, "band-weekend": 4000 } },
        { id: "t80", minGuests: 71, maxGuests: 80, bandPrices: { "band-weekdays": 8000, "band-weekend": 8000 } },
      ],
    } as unknown as PackageData;

    expect(getPackagePriceForGuests(pkg, 30)).toBe(3000);
    expect(getPackagePriceForGuests(pkg, 31)).toBe(3100);
    expect(getPackagePriceForGuests(pkg, 39)).toBe(3900);
    expect(getPackagePriceForGuests(pkg, 40)).toBe(4000);
    expect(getPackagePriceForGuests(pkg, 41)).toBe(4100);
    expect(getPackagePriceForGuests(pkg, 49)).toBe(4900);
    expect(getPackagePriceForGuests(pkg, 85)).toBe(8500);
  });

  it("sem data do evento usa o menor preço da faixa (segunda a sexta)", () => {
    const carrossel = {
      id: "5",
      pricingSchedule: cafeColonial.pricingSchedule,
      pricingTiers: [
        {
          id: "tier-50",
          minGuests: 41,
          maxGuests: 50,
          bandPrices: { "band-weekdays": 5279, "band-weekend": 5779 },
        },
      ],
    } as unknown as PackageData;

    expect(getPackagePriceForGuests(carrossel, 50)).toBe(5279);
    expect(getPackagePriceForGuests(carrossel, 50, "2026-07-18")).toBe(5779);
  });
});
