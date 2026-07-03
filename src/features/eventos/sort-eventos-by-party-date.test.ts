import { describe, expect, it, vi } from "vitest";

import { Evento } from "./types";
import { sortEventosByPartyDateExecutionOrder } from "./sort-eventos-by-party-date";

const baseEvento = (overrides: Partial<Evento>): Evento =>
  ({
    id: 1,
    tenant_id: 1,
    cliente_nome: "Cliente",
    created_at: "2026-06-01T12:00:00.000Z",
    data_evento: null,
    ...overrides,
  }) as Evento;

describe("sortEventosByPartyDateExecutionOrder", () => {
  it("coloca festas realizadas antes das futuras", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 2, 12, 0, 0));

    const events = sortEventosByPartyDateExecutionOrder([
      baseEvento({ id: 1, data_evento: "2026-07-10" }),
      baseEvento({ id: 2, data_evento: "2026-06-27" }),
    ]);

    expect(events.map((event) => event.id)).toEqual([2, 1]);

    vi.useRealTimers();
  });

  it("ordena futuras pela data mais próxima", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 2, 12, 0, 0));

    const events = sortEventosByPartyDateExecutionOrder([
      baseEvento({ id: 1, data_evento: "2026-08-01" }),
      baseEvento({ id: 2, data_evento: "2026-07-03" }),
      baseEvento({ id: 3, data_evento: "2026-07-20" }),
    ]);

    expect(events.map((event) => event.id)).toEqual([2, 3, 1]);

    vi.useRealTimers();
  });

  it("ordena realizadas da mais recente para a mais antiga", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 2, 12, 0, 0));

    const events = sortEventosByPartyDateExecutionOrder([
      baseEvento({ id: 1, data_evento: "2026-05-01" }),
      baseEvento({ id: 2, data_evento: "2026-06-27" }),
    ]);

    expect(events.map((event) => event.id)).toEqual([2, 1]);

    vi.useRealTimers();
  });

  it("envia eventos sem data para o final", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 2, 12, 0, 0));

    const events = sortEventosByPartyDateExecutionOrder([
      baseEvento({ id: 1, data_evento: null, created_at: "2026-06-20T12:00:00.000Z" }),
      baseEvento({ id: 2, data_evento: "2026-07-03" }),
    ]);

    expect(events.map((event) => event.id)).toEqual([2, 1]);

    vi.useRealTimers();
  });
});
