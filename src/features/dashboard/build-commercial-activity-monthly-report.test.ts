import { describe, expect, it } from "vitest";

import type { Evento } from "@/features/eventos";

import { buildCommercialActivityMonthlyReport } from "./build-commercial-activity-monthly-report";

const baseEvent = (overrides: Partial<Evento>): Evento =>
  ({
    checklist_concluidos: [],
    checklist_extras: [],
    cliente_nome: "Cliente",
    created_at: "2026-05-10T12:00:00.000Z",
    etapa: "contato_inicial",
    funil: "vendas",
    id: 1,
    status_interno: "novo",
    tipo_evento: "festa",
    updated_at: "2026-05-10T12:00:00.000Z",
    valor_entrada: 0,
    valor_total: 2000,
    ...overrides,
  }) as Evento;

describe("buildCommercialActivityMonthlyReport", () => {
  it("monta linhas do primeiro mes com dados ate o mes de referencia", () => {
    const referenceDate = new Date(2026, 6, 21, 12, 0, 0, 0);
    const events = [
      baseEvent({
        id: 1,
        created_at: "2026-05-10T15:00:00.000Z",
        updated_at: "2026-05-10T15:00:00.000Z",
      }),
      baseEvent({
        id: 2,
        created_at: "2026-05-20T15:00:00.000Z",
        updated_at: "2026-05-20T15:00:00.000Z",
      }),
      baseEvent({
        id: 3,
        created_at: "2026-06-05T15:00:00.000Z",
        updated_at: "2026-06-05T15:00:00.000Z",
      }),
      baseEvent({
        id: 10,
        created_at: "2026-04-01T12:00:00.000Z",
        funil: "festa",
        updated_at: "2026-05-15T12:00:00.000Z",
        valor_total: 4000,
      }),
      baseEvent({
        id: 11,
        created_at: "2026-05-01T12:00:00.000Z",
        funil: "festa",
        updated_at: "2026-07-05T12:00:00.000Z",
        valor_total: 5000,
      }),
    ];

    const rows = buildCommercialActivityMonthlyReport(
      events,
      [
        { accepted_at: "2026-05-15T12:00:00.000Z", evento_id: 10 },
        { accepted_at: "2026-07-05T12:00:00.000Z", evento_id: 11 },
      ],
      referenceDate,
    );

    expect(rows.map((row) => row.monthKey)).toEqual(["2026-05", "2026-06", "2026-07"]);
    expect(rows[0]).toMatchObject({
      closedParties: 1,
      conversionRate: 50,
      leadsEntered: 2,
      soldValue: 4000,
    });
    expect(rows[1]).toMatchObject({
      closedParties: 0,
      conversionRate: 0,
      leadsEntered: 1,
      soldValue: 0,
    });
    expect(rows[2]).toMatchObject({
      closedParties: 1,
      conversionRate: 0,
      leadsEntered: 0,
      soldValue: 5000,
    });
  });

  it("retorna vazio quando nao ha dados comerciais", () => {
    expect(buildCommercialActivityMonthlyReport([], [], new Date(2026, 6, 1))).toEqual([]);
  });
});
