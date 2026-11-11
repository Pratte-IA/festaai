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
  it("usa o preço fixo da faixa cadastrada para qualquer quantidade dentro dela", () => {
    expect(getPackagePriceForGuests(cafeColonial, 80, "2026-07-10")).toBe(9362.18);
    expect(getPackagePriceForGuests(cafeColonial, 85, "2026-07-10")).toBe(10213.85);
    expect(getPackagePriceForGuests(cafeColonial, 90, "2026-07-10")).toBe(10213.85);
    expect(getPackagePriceForGuests(cafeColonial, 71, "2026-07-10")).toBe(9362.18);
  });

  it("mantém o preço da faixa em toda a amplitude min–max", () => {
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
    expect(getPackagePriceForGuests(pkg, 31)).toBe(4000);
    expect(getPackagePriceForGuests(pkg, 39)).toBe(4000);
    expect(getPackagePriceForGuests(pkg, 40)).toBe(4000);
    // Buraco entre 40 e 71: mantém a faixa anterior.
    expect(getPackagePriceForGuests(pkg, 41)).toBe(4000);
    expect(getPackagePriceForGuests(pkg, 49)).toBe(4000);
    expect(getPackagePriceForGuests(pkg, 71)).toBe(8000);
    // Acima da última faixa: escala proporcionalmente.
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

  it("usa a tabela do ano da festa e cai no ano mais recente cadastrado", () => {
    const pkg = {
      id: "1",
      pricingSchedule: cafeColonial.pricingSchedule,
      pricingTiers: [
        {
          id: "t30",
          minGuests: 21,
          maxGuests: 30,
          bandPrices: { "band-weekdays": 3000, "band-weekend": 3600 },
          bandPricesByYear: {
            "2026": { "band-weekdays": 3000, "band-weekend": 3600 },
            "2027": { "band-weekdays": 3300, "band-weekend": 4000 },
          },
        },
      ],
    } as unknown as PackageData;

    expect(getPackagePriceForGuests(pkg, 30, "2026-03-11")).toBe(3000);
    expect(getPackagePriceForGuests(pkg, 30, "2027-03-13")).toBe(4000);
    // Acima do max da única faixa: escala a partir do preço do ano.
    expect(getPackagePriceForGuests(pkg, 31, "2027-03-13")).toBe(4133.33);
    expect(getPackagePriceForGuests(pkg, 30, "2028-01-08")).toBe(4000);
  });

  it("usa o preço cadastrado da faixa WeKids (sem interpolar dentro da faixa)", () => {
    const prata = {
      id: "10",
      pricingSchedule: cafeColonial.pricingSchedule,
      pricingTiers: [
        { id: "t50", minGuests: 50, maxGuests: 59, bandPrices: { "band-weekdays": 4990, "band-weekend": 5290 } },
        { id: "t60", minGuests: 60, maxGuests: 69, bandPrices: { "band-weekdays": 5390, "band-weekend": 5790 } },
        { id: "t70", minGuests: 70, maxGuests: 79, bandPrices: { "band-weekdays": 5890, "band-weekend": 6190 } },
        { id: "t80", minGuests: 80, maxGuests: 89, bandPrices: { "band-weekdays": 6290, "band-weekend": 6690 } },
        { id: "t100", minGuests: 100, maxGuests: 100, bandPrices: { "band-weekdays": 7390, "band-weekend": 7790 } },
      ],
    } as unknown as PackageData;

    expect(getPackagePriceForGuests(prata, 70, "2027-01-09")).toBe(6190);
    expect(getPackagePriceForGuests(prata, 60, "2027-03-14")).toBe(5790);
    expect(getPackagePriceForGuests(prata, 80, "2027-04-10")).toBe(6690);
    expect(getPackagePriceForGuests(prata, 100, "2027-07-31")).toBe(7790);
    expect(getPackagePriceForGuests(prata, 100, "2027-02-12")).toBe(7390);
  });
});
