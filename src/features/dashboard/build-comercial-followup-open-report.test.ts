import { describe, expect, it } from "vitest";

import type { Evento } from "@/features/eventos";

import {
  buildComercialFollowupOpenReport,
  getComercialFollowupOpenLabel,
} from "./build-comercial-followup-open-report";

const baseEvent = (overrides: Partial<Evento>): Evento =>
  ({
    aniversariante_nome: "Ana",
    checklist_concluidos: [],
    checklist_extras: [],
    cliente_nome: "Maria",
    created_at: "2026-07-01T10:00:00.000Z",
    data_evento: "2026-08-10",
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

describe("getComercialFollowupOpenLabel", () => {
  it("identifica FU0 e FU0b em contato inicial", () => {
    expect(getComercialFollowupOpenLabel(baseEvent({}))).toBe("Aguardando FU0");
    expect(
      getComercialFollowupOpenLabel(
        baseEvent({
          followup_0_enviado_em: "2026-07-01T12:00:00.000Z",
          contato_inicial_ultima_mensagem_em: "2026-07-01T13:00:00.000Z",
        }),
      ),
    ).toBe("Aguardando FU0b");
    expect(
      getComercialFollowupOpenLabel(
        baseEvent({
          followup_0_enviado_em: "2026-07-01T12:00:00.000Z",
          contato_inicial_ultima_mensagem_em: null,
        }),
      ),
    ).toBe("FU0 enviado");
  });

  it("identifica sequência FU1–FU4 em proposta enviada", () => {
    expect(
      getComercialFollowupOpenLabel(
        baseEvent({ etapa: "proposta_enviada", followup_status: "ativo" }),
      ),
    ).toBe("Aguardando FU1");
    expect(
      getComercialFollowupOpenLabel(
        baseEvent({
          etapa: "proposta_enviada",
          followup_status: "ativo",
          followup_1_enviado_em: "2026-07-02T12:00:00.000Z",
        }),
      ),
    ).toBe("FU1 enviado — aguardando FU2");
    expect(
      getComercialFollowupOpenLabel(
        baseEvent({
          etapa: "proposta_enviada",
          followup_status: "pausado_resposta",
        }),
      ),
    ).toBe("Cliente respondeu (pausado)");
  });
});

describe("buildComercialFollowupOpenReport", () => {
  it("lista apenas leads na esteira e monta as colunas do relatório", () => {
    const rows = buildComercialFollowupOpenReport([
      baseEvent({ id: 1, cliente_nome: "Ana Cliente" }),
      baseEvent({
        id: 2,
        cliente_nome: "Bruno",
        etapa: "proposta_enviada",
        followup_status: "ativo",
        data_evento: "2026-07-20",
      }),
      baseEvent({
        id: 3,
        etapa: "proposta_enviada",
        followup_status: "cancelado",
      }),
      baseEvent({
        id: 4,
        etapa: "contato_inicial",
        followup_0b_enviado_em: "2026-07-01T18:00:00.000Z",
      }),
    ]);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      clienteNome: "Ana Cliente",
      aniversarianteNome: "Ana",
      etapaLabel: "Contato Inicial",
      followLabel: "Aguardando FU0",
    });
    expect(rows[1]).toMatchObject({
      clienteNome: "Bruno",
      etapaLabel: "Proposta Enviada",
      followLabel: "Aguardando FU1",
    });
  });
});
