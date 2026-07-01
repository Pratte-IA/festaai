import { describe, expect, it } from "vitest";

import { Evento, EventoPagamento } from "@/features/eventos";

import { buildHistoricoFinanceiroEntries } from "./build-historico-financeiro-entries";

const baseEvento = (overrides: Partial<Evento> = {}): Evento =>
  ({
    id: 1,
    cliente_nome: "Cliente Teste",
    created_at: "2026-01-10T12:00:00.000Z",
    data_evento: "2026-06-07",
    funil: "executadas",
    valor_entrada: 0,
    valor_total: 5000,
    ...overrides,
  }) as Evento;

describe("buildHistoricoFinanceiroEntries", () => {
  it("inclui festa executada sem entrada nem pagamentos como quitação no período da festa", () => {
    const entries = buildHistoricoFinanceiroEntries({
      eventos: [baseEvento()],
      pagamentos: [],
      paidByEventoId: new Map(),
      period: { startDate: "2026-01-01", endDate: "2026-12-31" },
    });

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      type: "quitacao",
      valor: 5000,
      date: "2026-06-07",
      cliente: "Cliente Teste",
    });
  });

  it("não inclui festa executada fora do período selecionado", () => {
    const entries = buildHistoricoFinanceiroEntries({
      eventos: [baseEvento({ data_evento: "2025-06-07" })],
      pagamentos: [],
      paidByEventoId: new Map(),
      period: { startDate: "2026-01-01", endDate: "2026-12-31" },
    });

    expect(entries).toHaveLength(0);
  });

  it("completa quitação parcial quando há entrada e pagamentos registrados", () => {
    const event = baseEvento({ valor_entrada: 1000 });
    const pagamentos = [
      { id: 10, evento_id: 1, data_pagamento: "2026-05-01", valor: 500, metodo: "Pix", observacao: null },
    ] as EventoPagamento[];

    const entries = buildHistoricoFinanceiroEntries({
      eventos: [event],
      pagamentos,
      paidByEventoId: new Map([[1, 500]]),
      period: { startDate: "2026-01-01", endDate: "2026-12-31" },
    });

    expect(entries).toHaveLength(3);
    expect(entries.find((entry) => entry.type === "entrada")?.valor).toBe(1000);
    expect(entries.find((entry) => entry.type === "pagamento")?.valor).toBe(500);
    expect(entries.find((entry) => entry.type === "quitacao")?.valor).toBe(3500);
  });

  it("mantém lógica original para eventos fora do funil executadas", () => {
    const event = baseEvento({
      funil: "festa",
      valor_entrada: 800,
      fechamento_confirmado_em: "2026-03-15T10:00:00.000Z",
    });

    const entries = buildHistoricoFinanceiroEntries({
      eventos: [event],
      pagamentos: [],
      paidByEventoId: new Map(),
      period: { startDate: "2026-03-01", endDate: "2026-03-31" },
    });

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ type: "entrada", valor: 800, date: "2026-03-15" });
  });
});
