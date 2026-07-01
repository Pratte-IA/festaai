import { describe, expect, it } from "vitest";
import { formatIsoDateBR, parseIsoDateLocal } from "./date";

describe("date", () => {
  it("formata data ISO sem deslocar o dia no fuso do Brasil", () => {
    expect(formatIsoDateBR("2026-12-20")).toBe("20/12/2026");
    expect(formatIsoDateBR("2024-12-23")).toBe("23/12/2024");
    expect(formatIsoDateBR(null)).toBe("Nao informado");
  });

  it("interpreta data ISO no fuso local", () => {
    const date = parseIsoDateLocal("2026-12-20");
    expect(date).not.toBeNull();
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(11);
    expect(date?.getDate()).toBe(20);
  });
});
