import { describe, expect, it } from "vitest";

import type { Evento } from "@/features/eventos";

import { buildOperationalGuide } from "./operational-guide";

const baseEvent = (overrides: Partial<Evento>): Evento =>
  ({
    checklist_concluidos: [],
    cliente_nome: "Cliente Teste",
    created_at: "2026-07-01T10:00:00.000Z",
    data_evento: "2026-07-15",
    etapa: "boas_vindas",
    funil: "festa",
    id: 1,
    status_interno: "ativo",
    tipo_evento: "festa",
    updated_at: "2026-07-01T10:00:00.000Z",
    valor_entrada: 0,
    valor_total: 2000,
    ...overrides,
  }) as Evento;

describe("buildOperationalGuide", () => {
  it("agrupa festas da semana, boas vindas e checklist pendente", () => {
    const events = [
      baseEvent({ id: 1, etapa: "boas_vindas", data_evento: "2026-07-12" }),
      baseEvent({
        id: 2,
        cliente_nome: "Maria",
        etapa: "planejamento",
        checklist_concluidos: [],
        data_evento: "2026-07-20",
      }),
      baseEvent({
        id: 3,
        cliente_nome: "Joao",
        etapa: "planejamento",
        checklist_concluidos: ["item-1"],
        data_evento: "2026-07-25",
      }),
    ];

    const guide = buildOperationalGuide(events, [], []);

    expect(guide.sections.find((section) => section.id === "organize-boas-vindas")?.count).toBe(1);
    expect(guide.sections.find((section) => section.id === "start-checklist")?.count).toBe(1);
    expect(guide.sections.find((section) => section.id === "finalize-checklist")?.count).toBe(1);
    expect(guide.hasActions).toBe(true);
  });
});
