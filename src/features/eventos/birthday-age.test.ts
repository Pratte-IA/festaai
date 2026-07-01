import { describe, expect, it } from "vitest";
import {
  computeAgeOnDate,
  computeCelebratingAge,
  formatCelebratingAge,
  formatCurrentAge,
} from "./birthday-age";

describe("birthday-age", () => {
  const birthDate = "2024-12-23";

  it("calcula idade atual em anos completos", () => {
    expect(computeAgeOnDate(birthDate, "2025-12-23")).toBe(1);
    expect(computeAgeOnDate(birthDate, "2025-12-22")).toBe(0);
    expect(computeAgeOnDate(birthDate, "2026-07-01")).toBe(1);
  });

  it("calcula idade a ser comemorada em festa antecipada", () => {
    expect(computeCelebratingAge(birthDate, "2025-12-23")).toBe(1);
    expect(computeCelebratingAge(birthDate, "2025-12-20")).toBe(1);
    expect(computeCelebratingAge(birthDate, "2026-12-20")).toBe(2);
    expect(computeCelebratingAge(birthDate, "2026-12-23")).toBe(2);
    expect(computeCelebratingAge(birthDate, "2026-12-28")).toBe(2);
  });

  it("calcula idade comemorada em festa logo após o aniversário", () => {
    expect(computeCelebratingAge(birthDate, "2027-01-05")).toBe(2);
  });

  it("calcula primeira festa antes do aniversário", () => {
    expect(computeCelebratingAge(birthDate, "2025-06-01")).toBe(1);
  });

  it("formata idade com singular e plural", () => {
    expect(formatCelebratingAge(birthDate, "2026-12-20")).toBe("2 anos");
    expect(formatCelebratingAge(birthDate, "2025-12-23")).toBe("1 ano");
    expect(formatCelebratingAge(null, "2026-12-23")).toBe("Nao informado");
  });

  it("calcula idade atual com base em hoje", () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const currentAge = computeAgeOnDate(birthDate, today);

    expect(formatCurrentAge(birthDate)).toBe(
      currentAge === 1 ? "1 ano" : `${currentAge} anos`,
    );
  });
});
