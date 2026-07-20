import { describe, expect, it } from "vitest";

import { isBrazilianNationalHoliday } from "@/data/brazilian-holidays";
import {
  buildHolidayLookup,
  normalizeHolidayDateKey,
} from "@/features/holidays/check-tenant-holidays";

describe("normalizeHolidayDateKey", () => {
  it("normaliza ISO e rejeita inválidos", () => {
    expect(normalizeHolidayDateKey("2026-01-01")).toBe("2026-01-01");
    expect(normalizeHolidayDateKey("2026-01-01T12:00:00Z")).toBe("2026-01-01");
    expect(normalizeHolidayDateKey("01/01/2026")).toBeNull();
    expect(normalizeHolidayDateKey(null)).toBeNull();
  });
});

describe("buildHolidayLookup", () => {
  it("consulta por chave AAAA-MM-DD", () => {
    const lookup = buildHolidayLookup([
      {
        date: "2026-01-01",
        holidayKind: "official",
        holidayName: "Confraternização Universal",
        holidayScope: "national",
        holidaySource: "automatic",
        isHoliday: true,
      },
      {
        date: "2026-07-20",
        holidayKind: null,
        holidayName: null,
        holidayScope: null,
        holidaySource: null,
        isHoliday: false,
      },
    ]);

    expect(lookup.isHoliday("2026-01-01")).toBe(true);
    expect(lookup.isHoliday("2026-07-20")).toBe(false);
    expect(lookup.getResult("2026-01-01")?.holidayName).toBe("Confraternização Universal");
  });
});

describe("calendário automático 2026 (paridade com RPC)", () => {
  it("marca oficiais e facultativos comerciais", () => {
    expect(isBrazilianNationalHoliday("2026-01-01")).toBe(true);
    expect(isBrazilianNationalHoliday("2026-02-16")).toBe(true); // Carnaval segunda
    expect(isBrazilianNationalHoliday("2026-02-17")).toBe(true); // Carnaval terça
    expect(isBrazilianNationalHoliday("2026-04-03")).toBe(true); // Sexta Santa
    expect(isBrazilianNationalHoliday("2026-06-04")).toBe(true); // Corpus Christi
    expect(isBrazilianNationalHoliday("2026-07-20")).toBe(false);
  });
});
