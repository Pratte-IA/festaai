import { describe, expect, it } from "vitest";

import type { Evento } from "@/features/eventos";

import { buildCommercialActivity, countLeadsAttendedThisMonth, countLeadsAttendedThisWeek } from "./commercial-activity";

const baseEvent = (overrides: Partial<Evento>): Evento =>
  ({
    checklist_concluidos: [],
    checklist_extras: [],
    cliente_nome: "Cliente",
    created_at: "2026-07-09T10:00:00.000Z",
    etapa: "contato_inicial",
    funil: "vendas",
    id: 1,
    status_interno: "novo",
    tipo_evento: "festa",
    updated_at: "2026-07-09T10:00:00.000Z",
    valor_entrada: 0,
    valor_total: 2000,
    ...overrides,
  }) as Evento;

describe("commercial-activity", () => {
  it("conta leads atendidos na semana atual", () => {
    const events = [
      baseEvent({ id: 1, created_at: "2026-07-09T10:00:00.000Z" }),
      baseEvent({ id: 2, created_at: "2026-07-07T10:00:00.000Z" }),
      baseEvent({ id: 3, created_at: "2026-06-30T10:00:00.000Z" }),
      baseEvent({ id: 4, created_at: "2026-07-08T10:00:00.000Z", status_interno: "perdido" }),
    ];

    expect(countLeadsAttendedThisWeek(events)).toBe(2);
  });

  it("monta cards de atividade comercial", () => {
    const events = [
      baseEvent({ id: 1, created_at: "2026-07-09T12:00:00.000Z", status_interno: "novo" }),
      baseEvent({ id: 2, created_at: "2026-07-08T12:00:00.000Z" }),
      baseEvent({
        id: 3,
        created_at: "2026-07-01T12:00:00.000Z",
        funil: "festa",
        updated_at: "2026-07-09T12:00:00.000Z",
        valor_total: 5000,
      }),
    ];

    const activity = buildCommercialActivity(events);

    expect(activity.cards[0]?.subtitle).toMatch(/Hoje entrou/);
    expect(activity.cards[1]?.subtitle).toMatch(/Essa semana atendemos/);
    expect(activity.cards[2]?.subtitle).toMatch(/Este mês atendemos/);
    expect(activity.cards[3]?.subtitle).toMatch(/Este mês fechamos/);
    expect(activity.cards[4]?.subtitle).toMatch(/taxa de conversão/);
    expect(activity.cards[5]?.subtitle).toMatch(/Vendemos o valor de/);
  });

  it("conta leads atendidos no mês atual", () => {
    const events = [
      baseEvent({ id: 1, created_at: "2026-07-09T10:00:00.000Z" }),
      baseEvent({ id: 2, created_at: "2026-07-02T10:00:00.000Z" }),
      baseEvent({ id: 3, created_at: "2026-06-30T10:00:00.000Z" }),
    ];

    expect(countLeadsAttendedThisMonth(events)).toBe(2);
  });
});
