import { describe, expect, it } from "vitest";

import { Evento } from "@/features/eventos";

import {
  filterExecutadasFunnelEvents,
  filterExecutadasFunnelEventsByPartyDate,
} from "./filter-executadas-funnel-events";

const baseEvento = (overrides: Partial<Evento> = {}): Evento =>
  ({
    id: 1,
    funil: "executadas",
    data_evento: "2025-06-12",
    ...overrides,
  }) as Evento;

describe("filterExecutadasFunnelEvents", () => {
  it("retorna apenas eventos do funil executadas", () => {
    const events = [
      baseEvento({ id: 1 }),
      baseEvento({ id: 2, funil: "festa" }),
      baseEvento({ id: 3 }),
    ];

    expect(filterExecutadasFunnelEvents(events)).toHaveLength(2);
  });

  it("inclui festas sem data quando filtra por periodo", () => {
    const events = [
      baseEvento({ id: 1, data_evento: "2022-01-01" }),
      baseEvento({ id: 2, data_evento: null }),
    ];

    const filtered = filterExecutadasFunnelEventsByPartyDate(events, "2026-01-01", "2026-12-31");

    expect(filtered.map((event) => event.id)).toEqual([2]);
  });

  it("sem filtro de data retorna todas as executadas", () => {
    const events = [
      baseEvento({ id: 1, data_evento: "2022-01-01" }),
      baseEvento({ id: 2, data_evento: "2026-06-01" }),
    ];

    expect(filterExecutadasFunnelEventsByPartyDate(events)).toHaveLength(2);
  });
});
