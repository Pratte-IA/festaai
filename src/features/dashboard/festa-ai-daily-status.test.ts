import { describe, expect, it } from "vitest";

import type { Evento } from "@/features/eventos";

import { buildFestaAiDailyStatus, isInComercialFollowupPipeline } from "./festa-ai-daily-status";

const baseEvent = (overrides: Partial<Evento>): Evento =>
  ({
    checklist_concluidos: [],
    cliente_nome: "Cliente",
    created_at: "2026-07-01T10:00:00.000Z",
    etapa: "contato_inicial",
    funil: "vendas",
    id: 1,
    status_interno: "ativo",
    tipo_evento: "festa",
    updated_at: "2026-07-01T10:00:00.000Z",
    valor_entrada: 0,
    valor_total: 2000,
    ...overrides,
  }) as Evento;

describe("festa-ai-daily-status", () => {
  it("identifica leads na esteira comercial de follow-up", () => {
    expect(isInComercialFollowupPipeline(baseEvent({ etapa: "contato_inicial" }))).toBe(true);
    expect(
      isInComercialFollowupPipeline(
        baseEvent({ etapa: "contato_inicial", followup_0b_enviado_em: "2026-07-01T10:00:00.000Z" }),
      ),
    ).toBe(false);
    expect(
      isInComercialFollowupPipeline(
        baseEvent({ etapa: "proposta_enviada", followup_status: "ativo" }),
      ),
    ).toBe(true);
    expect(
      isInComercialFollowupPipeline(
        baseEvent({ etapa: "proposta_enviada", followup_status: "cancelado" }),
      ),
    ).toBe(false);
  });

  it("monta os quatro cards de status do FestaAI", () => {
    const events = [
      baseEvent({ id: 1, etapa: "contato_inicial" }),
      baseEvent({ id: 2, etapa: "contato_inicial" }),
      baseEvent({ id: 3, etapa: "proposta_enviada", followup_status: "ativo" }),
      baseEvent({ id: 4, etapa: "perdido", status_interno: "perdido" }),
    ];

    const status = buildFestaAiDailyStatus(events, [3]);

    expect(status.sections).toHaveLength(4);
    expect(status.sections[0]?.subtitle).toBe(
      "Estamos em etapa de contato inicial com 2 clientes",
    );
    expect(status.sections[1]?.subtitle).toBe("Enviamos 1 proposta");
    expect(status.sections[2]?.subtitle).toBe("Temos 1 contrato a serem assinados");
    expect(status.sections[3]?.count).toBe(3);
    expect(status.sections[3]?.title).toBe("Follow-up comercial");
  });
});
