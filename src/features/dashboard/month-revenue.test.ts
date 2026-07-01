import { describe, expect, it } from "vitest";

import { Evento, EventoPagamento } from "@/features/eventos";

import { buildMonthRevenueBreakdown } from "./month-revenue";

const julyRange = {
  startDate: "2026-07-01",
  endDate: "2026-07-31",
  startIso: "2026-07-01T00:00:00.000Z",
  endIso: "2026-07-31T23:59:59.999Z",
};

const baseEvento = (overrides: Partial<Evento> = {}): Evento =>
  ({
    id: 1,
    funil: "festa",
    valor_entrada: 500,
    created_at: "2026-07-05T10:00:00.000Z",
    fechamento_confirmado_em: "2026-07-05T12:00:00.000Z",
    ...overrides,
  }) as Evento;

const basePayment = (overrides: Partial<EventoPagamento> = {}): EventoPagamento =>
  ({
    id: 1,
    evento_id: 1,
    valor: 200,
    data_pagamento: "2026-07-10",
    ...overrides,
  }) as EventoPagamento;

describe("month-revenue", () => {
  it("soma entradas apenas de festa ou executadas confirmadas no mes", () => {
    const breakdown = buildMonthRevenueBreakdown(
      [
        baseEvento({ id: 1, valor_entrada: 500 }),
        baseEvento({ id: 2, funil: "vendas", valor_entrada: 900 }),
        baseEvento({
          id: 3,
          valor_entrada: 300,
          fechamento_confirmado_em: "2026-06-20T10:00:00.000Z",
          created_at: "2026-06-01T10:00:00.000Z",
        }),
        baseEvento({ id: 4, funil: "executadas", valor_entrada: 150 }),
      ],
      [],
      julyRange,
    );

    expect(breakdown.monthFestaEntradas).toBe(650);
  });

  it("soma pagamentos cadastrados com data no mes", () => {
    const breakdown = buildMonthRevenueBreakdown(
      [],
      [
        basePayment({ valor: 200 }),
        basePayment({ id: 2, valor: 350, data_pagamento: "2026-08-01" }),
      ],
      julyRange,
    );

    expect(breakdown.monthPaymentsReceived).toBe(200);
  });

  it("calcula faturamento total como entradas mais pagamentos", () => {
    const breakdown = buildMonthRevenueBreakdown(
      [baseEvento({ valor_entrada: 500 })],
      [basePayment({ valor: 200 })],
      julyRange,
    );

    expect(breakdown.monthRevenue).toBe(700);
  });
});
