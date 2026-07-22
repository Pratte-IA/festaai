import { describe, expect, it } from "vitest";

import { Evento } from "@/features/eventos";

import {
  getEventOpenBalance,
  sumFestaOpenBalance,
  sumFestaOverdueOpenBalance,
} from "./festa-open-balance";

const baseEvento = (overrides: Partial<Evento> = {}): Evento =>
  ({
    id: 1,
    funil: "festa",
    valor_total: 5000,
    valor_entrada: 1000,
    data_evento: "2026-08-15",
    ...overrides,
  }) as Evento;

describe("festa-open-balance", () => {
  it("calcula saldo em aberto descontando entrada e pagamentos", () => {
    const paidByEvent = new Map([[1, 500]]);

    expect(getEventOpenBalance(baseEvento(), paidByEvent)).toBe(3500);
  });

  it("soma apenas eventos do funil festa com saldo positivo", () => {
    const paidByEvent = new Map<number, number>();
    const events = [
      baseEvento({ id: 1, valor_total: 4000, valor_entrada: 1000 }),
      baseEvento({ id: 2, funil: "vendas", valor_total: 9000, valor_entrada: 0 }),
      baseEvento({ id: 3, valor_total: 2000, valor_entrada: 2000 }),
      baseEvento({ id: 4, valor_total: 3000, valor_entrada: 500 }),
    ];

    expect(sumFestaOpenBalance(events, paidByEvent)).toBe(5500);
  });

  it("soma saldo vencido pelo vencimento do recebivel (nao pela data da festa)", () => {
    const paidByEvent = new Map<number, number>();
    const referenceDate = new Date(2026, 6, 21, 12, 0, 0, 0);
    const events = [
      // Festa futura, mas vencimento (data_evento - 7) = 18/07 já passou
      baseEvento({ id: 1, data_evento: "2026-07-25", valor_total: 4000, valor_entrada: 1000 }),
      // Festa futura com vencimento ainda à frente
      baseEvento({ id: 2, data_evento: "2026-08-15", valor_total: 3000, valor_entrada: 500 }),
      // Já com data_limite_pagamento explícita vencida
      baseEvento({
        id: 3,
        data_evento: "2026-08-20",
        data_limite_pagamento: "2026-07-10",
        valor_total: 2000,
        valor_entrada: 500,
      }),
      baseEvento({ id: 4, funil: "vendas", data_evento: "2026-05-01", valor_total: 8000, valor_entrada: 0 }),
    ];

    // id1: 3000 + id3: 1500
    expect(sumFestaOverdueOpenBalance(events, paidByEvent, referenceDate)).toBe(4500);
  });

  it("nao considera saldo em aberto para festas executadas", () => {
    const paidByEvent = new Map<number, number>();
    const events = [
      baseEvento({ id: 1, funil: "executadas", valor_total: 4000, valor_entrada: 0 }),
    ];

    expect(getEventOpenBalance(events[0], paidByEvent)).toBe(0);
    expect(sumFestaOpenBalance(events, paidByEvent)).toBe(0);
  });
});
