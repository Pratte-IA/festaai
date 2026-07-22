import { describe, expect, it } from "vitest";

import type { Evento } from "@/features/eventos";

import {
  buildNeedsAttention,
  isPausedFollowNeedingAttention,
  isPartyWithinDaysNeedingChecklist,
  isProvaSocialMktNeedingAttention,
} from "./build-needs-attention";

const baseEvent = (overrides: Partial<Evento>): Evento =>
  ({
    checklist_concluidos: [],
    checklist_extras: [],
    cliente_nome: "Cliente",
    created_at: "2026-06-01T10:00:00.000Z",
    data_evento: "2026-08-15",
    etapa: "planejamento",
    funil: "festa",
    id: 1,
    status_interno: "ativo",
    tipo_evento: "festa",
    updated_at: "2026-06-01T10:00:00.000Z",
    valor_entrada: 1000,
    valor_total: 5000,
    ...overrides,
  }) as Evento;

describe("buildNeedsAttention", () => {
  const referenceDate = new Date(2026, 6, 21, 12, 0, 0, 0);

  it("separa financeiro, follows parados, boas vindas e checklist 30 dias", () => {
    const events = [
      baseEvent({
        id: 1,
        cliente_nome: "Saldo",
        data_evento: "2026-07-25",
        etapa: "festa_pronta",
        valor_entrada: 0,
      }),
      baseEvent({
        id: 2,
        cliente_nome: "Respondeu",
        funil: "vendas",
        etapa: "proposta_enviada",
        followup_status: "pausado_resposta",
        data_evento: null,
      }),
      baseEvent({
        id: 3,
        cliente_nome: "Boas",
        etapa: "boas_vindas",
        data_evento: "2026-08-05",
      }),
      baseEvent({
        id: 7,
        cliente_nome: "Boas longe",
        etapa: "boas_vindas",
        data_evento: "2026-09-20",
      }),
      baseEvent({
        id: 4,
        cliente_nome: "Checklist",
        etapa: "planejamento",
        data_evento: "2026-08-10",
      }),
      baseEvent({
        id: 5,
        cliente_nome: "Longe",
        etapa: "planejamento",
        data_evento: "2026-10-01",
      }),
      baseEvent({
        id: 6,
        cliente_nome: "Follow ativo",
        funil: "vendas",
        etapa: "proposta_enviada",
        followup_status: "ativo",
      }),
      baseEvent({
        id: 8,
        cliente_nome: "Prova social",
        funil: "executadas",
        etapa: "redes_sociais",
        data_evento: "2026-07-10",
      }),
      baseEvent({
        id: 9,
        cliente_nome: "Prova futura",
        funil: "executadas",
        etapa: "redes_sociais",
        data_evento: "2026-08-01",
      }),
    ];

    const attention = buildNeedsAttention(events, [], { referenceDate });

    expect(attention.sections.find((s) => s.id === "financeiro")?.items).toHaveLength(1);
    expect(attention.sections.find((s) => s.id === "follows-parados")?.items).toHaveLength(1);
    expect(attention.sections.find((s) => s.id === "organizar-boas-vindas")?.items).toHaveLength(1);
    expect(attention.sections.find((s) => s.id === "checklist-30-dias")?.items.map((i) => i.title)).toEqual([
      expect.stringContaining("Checklist"),
    ]);
    expect(attention.sections.find((s) => s.id === "prova-social-mkt")?.items.map((i) => i.title)).toEqual([
      expect.stringContaining("Prova social"),
    ]);
    expect(attention.totalCount).toBe(5);
  });

  it("detecta follow pausado por resposta do cliente", () => {
    expect(
      isPausedFollowNeedingAttention(
        baseEvent({ funil: "vendas", etapa: "proposta_enviada", followup_status: "pausado_resposta" }),
      ),
    ).toBe(true);
    expect(
      isPausedFollowNeedingAttention(
        baseEvent({ funil: "vendas", etapa: "proposta_enviada", followup_status: "ativo" }),
      ),
    ).toBe(false);
  });

  it("detecta planejamento com festa em ate 30 dias", () => {
    expect(
      isPartyWithinDaysNeedingChecklist(
        baseEvent({ etapa: "planejamento", data_evento: "2026-08-10" }),
        referenceDate,
      ),
    ).toBe(true);
    expect(
      isPartyWithinDaysNeedingChecklist(
        baseEvent({ etapa: "planejamento", data_evento: "2026-10-01" }),
        referenceDate,
      ),
    ).toBe(false);
  });

  it("detecta prova social pendente apos a festa", () => {
    expect(
      isProvaSocialMktNeedingAttention(
        baseEvent({
          funil: "executadas",
          etapa: "redes_sociais",
          data_evento: "2026-07-10",
        }),
        referenceDate,
      ),
    ).toBe(true);
    expect(
      isProvaSocialMktNeedingAttention(
        baseEvent({
          funil: "executadas",
          etapa: "redes_sociais",
          data_evento: "2026-08-01",
        }),
        referenceDate,
      ),
    ).toBe(false);
  });
});
