import { describe, expect, it } from "vitest";

import { isBrazilianNationalHoliday } from "@/data/brazilian-holidays";
import {
  buildPricingSchedule,
  resolvePricingBandForDate,
} from "@/data/pricing-schedule";

describe("resolvePricingBandForDate", () => {
  const schedule = buildPricingSchedule("seg_sex_fds_feriado");

  it("usa faixa de dias úteis para uma quarta-feira comum", () => {
    const band = resolvePricingBandForDate(schedule, "2026-06-17", () => false);
    expect(band?.id).toBe("band-weekdays");
  });

  it("usa faixa de fim de semana para sábado", () => {
    const band = resolvePricingBandForDate(schedule, "2026-06-20", () => false);
    expect(band?.id).toBe("band-weekend");
  });

  it("usa faixa de fim de semana para domingo", () => {
    const band = resolvePricingBandForDate(schedule, "2026-06-21", () => false);
    expect(band?.id).toBe("band-weekend");
  });

  it("usa faixa de feriado para dia nacional em dia útil", () => {
    const band = resolvePricingBandForDate(schedule, "2026-05-01", isBrazilianNationalHoliday);
    expect(band?.id).toBe("band-weekend");
  });
});

describe("isBrazilianNationalHoliday", () => {
  it("identifica feriados fixos e móveis", () => {
    expect(isBrazilianNationalHoliday("2026-01-01")).toBe(true);
    expect(isBrazilianNationalHoliday("2026-05-01")).toBe(true);
    expect(isBrazilianNationalHoliday("2026-04-03")).toBe(true);
    expect(isBrazilianNationalHoliday("2026-06-17")).toBe(false);
  });
});
