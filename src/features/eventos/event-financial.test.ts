import { describe, expect, it } from "vitest";

import { Evento } from "@/features/eventos";

import {
  getEventBalance,
  getEventDisplayTotalPaid,
  isEventFullySettled,
} from "./event-financial";

const baseEvento = (overrides: Partial<Evento> = {}): Evento =>
  ({
    id: 1,
    funil: "festa",
    valor_total: 5000,
    valor_entrada: 1000,
    ...overrides,
  }) as Evento;

describe("event-financial", () => {
  it("considera festas executadas como quitadas", () => {
    const event = baseEvento({ funil: "executadas", valor_entrada: 0 });

    expect(isEventFullySettled(event)).toBe(true);
    expect(getEventDisplayTotalPaid(event, 0)).toBe(5000);
    expect(getEventBalance(event, 0)).toBe(0);
  });

  it("calcula saldo normalmente para festas em andamento", () => {
    const event = baseEvento();

    expect(getEventDisplayTotalPaid(event, 500)).toBe(1500);
    expect(getEventBalance(event, 500)).toBe(3500);
  });
});
