import { describe, expect, it } from "vitest";

import {
  getBrazilTodayIsoDate,
  isPostPartyAutomationActive,
  POST_PARTY_AUTOMATION_EFFECTIVE_DATE,
  shouldTransitionToAguardandoFeedback,
} from "./post-party-automation";

describe("post-party-automation", () => {
  it("usa a data efetiva acordada", () => {
    expect(POST_PARTY_AUTOMATION_EFFECTIVE_DATE).toBe("2026-07-05");
  });

  it("fica inativo antes da data efetiva", () => {
    expect(isPostPartyAutomationActive("2026-07-04")).toBe(false);
    expect(isPostPartyAutomationActive("2026-07-05")).toBe(true);
    expect(isPostPartyAutomationActive("2026-07-06")).toBe(true);
  });

  it("move apenas no dia posterior à festa", () => {
    expect(
      shouldTransitionToAguardandoFeedback("2026-07-05", "2026-07-05"),
    ).toBe(false);
    expect(
      shouldTransitionToAguardandoFeedback("2026-07-05", "2026-07-06"),
    ).toBe(true);
    expect(
      shouldTransitionToAguardandoFeedback("2026-07-05", "2026-07-04"),
    ).toBe(false);
  });

  it("não move antes da data efetiva mesmo após a festa", () => {
    expect(
      shouldTransitionToAguardandoFeedback("2026-07-01", "2026-07-04"),
    ).toBe(false);
  });

  it("calcula hoje no fuso de São Paulo", () => {
    const noonUtc = new Date("2026-07-06T03:00:00.000Z");
    expect(getBrazilTodayIsoDate(noonUtc)).toBe("2026-07-06");
  });
});
