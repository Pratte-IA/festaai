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
    expect(getPackagePriceForGuests(cafeColonial, 90, "2026-07-10")).toBe(10213.85);
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
