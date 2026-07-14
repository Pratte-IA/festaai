import { describe, expect, it } from "vitest";

import {
  addYearsToIsoDate,
  getFop1TriggerDate,
  getFop2TriggerDate,
  getFop3TriggerDate,
  getReativacaoTargetPartyDate,
  isPastPartyForReativacao,
  shouldResetReativacaoCycle,
} from "./perdido-reativacao-schedule";

describe("perdido-reativacao-schedule", () => {
  it("identifica festa já realizada", () => {
    expect(isPastPartyForReativacao("2025-07-15", "2026-03-01")).toBe(true);
    expect(isPastPartyForReativacao("2026-08-15", "2026-03-01")).toBe(false);
  });

  it("calcula data alvo da festa no ano seguinte", () => {
    expect(getReativacaoTargetPartyDate("2025-07-15", "2026-03-01")).toBe("2026-07-15");
    expect(getReativacaoTargetPartyDate("2025-07-15", "2026-08-01")).toBe("2027-07-15");
  });

  it("calcula gatilhos FOP1, FOP2 e FOP3", () => {
    const target = "2026-07-15";

    expect(getFop1TriggerDate(target)).toBe("2026-01-01");
    expect(getFop3TriggerDate(target)).toBe("2026-04-16");
    expect(getFop2TriggerDate("2026-01-15T14:00:00.000Z")).toBe("2026-02-14");
  });

  it("reinicia ciclo após FOP3 no ano seguinte", () => {
    const reativacaoFestaAlvo = "2026-07-15";
    const nextTarget = addYearsToIsoDate(reativacaoFestaAlvo, 1);

    expect(nextTarget).toBe("2027-07-15");
    expect(
      shouldResetReativacaoCycle({
        fop3EnviadoEm: "2026-04-20T12:00:00.000Z",
        reativacaoFestaAlvo,
        todayIso: "2026-12-31",
      }),
    ).toBe(false);

    expect(
      shouldResetReativacaoCycle({
        fop3EnviadoEm: "2026-04-20T12:00:00.000Z",
        reativacaoFestaAlvo,
        todayIso: "2027-01-01",
      }),
    ).toBe(true);
  });
});
