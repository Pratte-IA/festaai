import { describe, expect, it } from "vitest";

import {
  getFup1TriggerDate,
  isEligibleForFup1Dispatch,
  isFuturePartyForPerdidoFollowup,
} from "./perdido-futuro-schedule";

describe("perdido-futuro-schedule", () => {
  it("identifica festa futura", () => {
    expect(isFuturePartyForPerdidoFollowup("2026-09-15", "2026-07-13")).toBe(true);
    expect(isFuturePartyForPerdidoFollowup("2026-06-01", "2026-07-13")).toBe(false);
  });

  it("calcula gatilho FUP1 60 dias antes", () => {
    expect(getFup1TriggerDate("2026-09-15")).toBe("2026-07-17");
  });

  it("elegível no dia do gatilho com festa futura", () => {
    expect(
      isEligibleForFup1Dispatch({
        dataEvento: "2026-09-15",
        fup1EnviadoEm: null,
        todayIso: "2026-07-17",
      }),
    ).toBe(true);

    expect(
      isEligibleForFup1Dispatch({
        dataEvento: "2026-09-15",
        fup1EnviadoEm: "2026-07-17T12:00:00.000Z",
        todayIso: "2026-07-18",
      }),
    ).toBe(false);
  });
});
