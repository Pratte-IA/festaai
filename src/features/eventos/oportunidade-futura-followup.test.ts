import { describe, expect, it } from "vitest";

import {
  getOportunidadeFuturaFofKanbanBadge,
  getOportunidadeFuturaFofRespondedKanbanBadge,
} from "./oportunidade-futura-followup";

describe("oportunidade-futura-followup badges", () => {
  it("mostra badge do último FOF enviado", () => {
    expect(
      getOportunidadeFuturaFofKanbanBadge({
        etapa: "oportunidade_futura",
        fof1_enviado_em: "2026-01-01T12:00:00.000Z",
        fof_status: "ativo",
      })?.label,
    ).toBe("FOF1 ✓");

    expect(
      getOportunidadeFuturaFofKanbanBadge({
        etapa: "oportunidade_futura",
        fof1_enviado_em: "2026-01-01T12:00:00.000Z",
        fof2_enviado_em: "2026-02-01T12:00:00.000Z",
        fof_status: "ativo",
      })?.label,
    ).toBe("FOF2 ✓");
  });

  it("mostra badge de resposta", () => {
    expect(
      getOportunidadeFuturaFofRespondedKanbanBadge({
        etapa: "oportunidade_futura",
        fof_resposta_cliente_em: "2026-01-10T12:00:00.000Z",
        fof_status: "pausado_resposta",
      })?.label,
    ).toBe("Respondeu");
  });

  it("ignora etapas que não são oportunidade futura", () => {
    expect(
      getOportunidadeFuturaFofKanbanBadge({
        etapa: "redes_sociais",
        fof1_enviado_em: "2026-01-01T12:00:00.000Z",
        fof_status: "ativo",
      }),
    ).toBeNull();
  });
});
