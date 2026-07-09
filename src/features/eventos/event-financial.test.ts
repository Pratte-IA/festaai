import { describe, expect, it } from "vitest";

import { Evento } from "@/features/eventos";

import {
  computeClosingFormValorSaldo,
  getEventBalance,
  getEventBalanceFromReceivable,
  getEventDisplayTotalPaid,
  getEventoEntradaDescricao,
  getEventoEntradaReferenceDate,
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

  it("calcula saldo com total a receber ajustado por desconto", () => {
    const event = baseEvento();

    expect(getEventBalanceFromReceivable(event, 4700, 1000)).toBe(2700);
  });

  it("calcula saldo devedor do formulário como total menos entrada", () => {
    expect(computeClosingFormValorSaldo(5779, 500)).toBe(5279);
    expect(computeClosingFormValorSaldo(500, 500)).toBe(0);
    expect(computeClosingFormValorSaldo(1990, 0)).toBe(1990);
  });

  it("monta descrição e data de referência da entrada do contrato", () => {
    const event = baseEvento({
      created_at: "2026-01-10T08:00:00.000Z",
      fechamento_confirmado_em: "2026-03-15T10:00:00.000Z",
      forma_pagamento_entrada: "Pix",
    });

    expect(getEventoEntradaReferenceDate(event)).toBe("2026-03-15");
    expect(getEventoEntradaDescricao(event)).toBe("Entrada · Pix");
    expect(getEventoEntradaDescricao(baseEvento({ forma_pagamento_entrada: null }))).toBe("Entrada");
  });
});
