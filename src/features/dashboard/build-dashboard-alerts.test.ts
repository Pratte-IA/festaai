import { describe, expect, it } from "vitest";

import type { Evento, EventoPagamento } from "@/features/eventos";

import {
  buildDashboardAlerts,
  isStalePropostaWithoutActiveFollowup,
} from "./build-dashboard-alerts";

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

describe("buildDashboardAlerts", () => {
  const referenceDate = new Date(2026, 6, 21, 12, 0, 0, 0);

  it("alerta saldo apenas em festa com recebivel vencido e saldo real", () => {
    const events = [
      // Vencimento 18/07 — em atraso, funil festa
      baseEvent({ id: 1, cliente_nome: "Atrasada", data_evento: "2026-07-25" }),
      // Festa futura sem vencimento ainda
      baseEvent({ id: 2, cliente_nome: "Futura", data_evento: "2026-08-15" }),
      // Executada — considerada quitada
      baseEvent({
        id: 3,
        cliente_nome: "Executada",
        funil: "executadas",
        etapa: "aguardando_feedback",
        data_evento: "2026-06-13",
        valor_entrada: 0,
      }),
      // Vendas não entra no alerta de saldo
      baseEvent({
        id: 4,
        cliente_nome: "Vendas",
        funil: "vendas",
        etapa: "proposta_enviada",
        data_evento: "2026-06-01",
        valor_entrada: 0,
      }),
    ];

    const alerts = buildDashboardAlerts(events, [], { referenceDate });
    const prazo = alerts.filter((alert) => alert.type === "prazo");

    expect(prazo).toHaveLength(1);
    expect(prazo[0]?.title).toContain("Atrasada");
    expect(prazo[0]?.description).toMatch(/vencimento ja ultrapassado/);
  });

  it("nao alerta proposta se o follow-up automatico esta ativo", () => {
    expect(
      isStalePropostaWithoutActiveFollowup(
        baseEvent({
          funil: "vendas",
          etapa: "proposta_enviada",
          followup_status: "ativo",
          updated_at: "2026-07-01T10:00:00.000Z",
        }),
        referenceDate.getTime(),
      ),
    ).toBe(false);

    expect(
      isStalePropostaWithoutActiveFollowup(
        baseEvent({
          funil: "vendas",
          etapa: "proposta_enviada",
          followup_status: null,
          updated_at: "2026-07-01T10:00:00.000Z",
        }),
        referenceDate.getTime(),
      ),
    ).toBe(true);
  });

  it("prioriza prazos e limita a 5 itens", () => {
    const events = Array.from({ length: 8 }, (_, index) =>
      baseEvent({
        id: index + 1,
        cliente_nome: `Festa ${index + 1}`,
        data_evento: "2026-07-10",
        valor_entrada: 0,
        valor_total: 1000,
      }),
    );

    const payments: EventoPagamento[] = [];
    const alerts = buildDashboardAlerts(events, payments, { limit: 5, referenceDate });

    expect(alerts).toHaveLength(5);
    expect(alerts.every((alert) => alert.type === "prazo")).toBe(true);
  });
});
