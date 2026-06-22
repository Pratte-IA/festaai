import { describe, expect, it } from "vitest";

import { buildMonthDays } from "@/features/calendario/calendar-utils";
import { Evento } from "@/features/eventos";

const baseEvento = (overrides: Partial<Evento>): Evento =>
  ({
    id: 1,
    tenant_id: 1,
    cliente_nome: "Cliente",
    data_evento: "2026-04-19",
    hora_evento: "15:00:00",
    tipo_evento: "festa",
    funil: "festa",
    etapa: "boas_vindas",
    status_interno: "ativo",
    created_at: "2026-04-01T00:00:00.000Z",
    updated_at: "2026-04-01T00:00:00.000Z",
    ...overrides,
  }) as Evento;

describe("buildMonthDays", () => {
  it("trava a agenda apenas para festas fechadas (funil Festa, contrato assinado)", () => {
    const days = buildMonthDays(2026, 3, [
      baseEvento({ id: 1, funil: "festa", data_evento: "2026-04-19" }),
      baseEvento({
        id: 2,
        funil: "vendas",
        etapa: "negociacao",
        tipo_evento: "festa",
        data_evento: "2026-04-20",
      }),
      baseEvento({
        id: 3,
        funil: "executadas",
        etapa: "aguardando_feedback",
        data_evento: "2026-04-21",
      }),
    ], []);

    const day19 = days.find((day) => day.date === "2026-04-19");
    const day20 = days.find((day) => day.date === "2026-04-20");
    const day21 = days.find((day) => day.date === "2026-04-21");

    expect(day19?.status).toBe("reservado");
    expect(day19?.festas).toHaveLength(1);
    expect(day19?.visitas).toHaveLength(0);

    expect(day20?.status).toBe("disponivel");
    expect(day20?.festas).toHaveLength(0);
    expect(day20?.visitas).toHaveLength(0);

    expect(day21?.status).toBe("disponivel");
    expect(day21?.festas).toHaveLength(0);
    expect(day21?.visitas).toHaveLength(0);
  });

  it("mostra visitas do funil Vendas sem bloquear a data", () => {
    const days = buildMonthDays(2026, 3, [
      baseEvento({
        id: 4,
        funil: "vendas",
        etapa: "visita_agendada",
        tipo_evento: "visita",
        data_evento: "2026-04-22",
      }),
    ], []);

    const day22 = days.find((day) => day.date === "2026-04-22");
    expect(day22?.status).toBe("disponivel");
    expect(day22?.visitas).toHaveLength(1);
    expect(day22?.festas).toHaveLength(0);
  });

  it("ignora leads perdidos ou cancelados", () => {
    const days = buildMonthDays(2026, 3, [
      baseEvento({
        id: 5,
        etapa: "perdido",
        status_interno: "perdido",
        data_evento: "2026-04-23",
      }),
      baseEvento({
        id: 6,
        funil: "vendas",
        etapa: "perdido",
        status_interno: "perdido",
        data_evento: "2026-04-24",
      }),
    ], []);

    expect(days.find((day) => day.date === "2026-04-23")?.festas).toHaveLength(0);
    expect(days.find((day) => day.date === "2026-04-24")?.visitas).toHaveLength(0);
  });

  it("nao mostra orcamentos com data tentativa no calendario", () => {
    const days = buildMonthDays(2026, 3, [
      baseEvento({
        id: 8,
        funil: "vendas",
        etapa: "negociacao",
        tipo_evento: "festa",
        data_evento: "2026-04-26",
      }),
    ], []);

    const day26 = days.find((day) => day.date === "2026-04-26");
    expect(day26?.festas).toHaveLength(0);
    expect(day26?.visitas).toHaveLength(0);
    expect(day26?.status).toBe("disponivel");
  });

  it("prioriza bloqueio manual sobre festas fechadas", () => {
    const days = buildMonthDays(
      2026,
      3,
      [baseEvento({ id: 7, data_evento: "2026-04-25" })],
      [{ id: 1, tenant_id: 1, data: "2026-04-25", motivo: null, created_by: null, updated_by: null, created_at: "", updated_at: "" }],
    );

    const day25 = days.find((day) => day.date === "2026-04-25");
    expect(day25?.status).toBe("bloqueado");
    expect(day25?.festas).toHaveLength(1);
  });
});
