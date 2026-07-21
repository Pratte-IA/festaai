import { describe, expect, it } from "vitest";

import type { Evento } from "@/features/eventos";

import { buildOperationalPartyDisplay, formatOperationalPartyDateLabel, formatRelativeDaysLabel } from "./operational-party-display";

const baseEvent = (overrides: Partial<Evento>): Evento =>
  ({
    aniversariante_nome: "Maria Clara prim do nascimento",
    checklist_concluidos: [],
    checklist_extras: [],
    cliente_nome: "Judi cristina prim do nascimento",
    created_at: "2026-07-01T10:00:00.000Z",
    data_evento: "2026-07-11",
    etapa: "planejamento",
    funil: "festa",
    id: 1,
    status_interno: "ativo",
    tipo_evento: "festa",
    updated_at: "2026-07-01T10:00:00.000Z",
    valor_entrada: 0,
    valor_total: 2000,
    ...overrides,
  }) as Evento;

describe("operational-party-display", () => {
  it("formata data com dia da semana", () => {
    expect(formatOperationalPartyDateLabel("2026-07-11")).toBe("11 Jul - Sábado");
  });

  it("monta nomes curtos e status da festa", () => {
    const display = buildOperationalPartyDisplay(baseEvent({ etapa: "boas_vindas" }));

    expect(display.aniversarianteNome).toBe("Maria Clara");
    expect(display.clienteNome).toBe("Judi");
    expect(display.isSamePerson).toBe(false);
    expect(display.partyDateLabel).toBe("11 Jul - Sábado");
    expect(display.statusLabel).toBe("Boas Vindas");
  });

  it("formata dias relativos ate a festa", () => {
    expect(formatRelativeDaysLabel(0)).toBe("é hoje");
    expect(formatRelativeDaysLabel(1)).toBe("Falta 1 dia");
    expect(formatRelativeDaysLabel(20)).toBe("Faltam 20 dias");
    expect(formatRelativeDaysLabel(-3)).toBe("há 3 dias");
  });
});
