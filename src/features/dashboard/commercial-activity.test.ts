import { describe, expect, it } from "vitest";

import type { Evento } from "@/features/eventos";
import { getTodayAtNoon } from "@/lib/date";

import {
  buildCommercialActivity,
  countNewLeadsLast7Days,
  countNewLeadsThisMonth,
  countProposalsSentThisMonth,
} from "./commercial-activity";

const baseEvent = (overrides: Partial<Evento>): Evento =>
  ({
    checklist_concluidos: [],
    checklist_extras: [],
    cliente_nome: "Cliente",
    created_at: "2026-07-09T10:00:00.000Z",
    etapa: "contato_inicial",
    funil: "vendas",
    id: 1,
    status_interno: "novo",
    tipo_evento: "festa",
    updated_at: "2026-07-09T10:00:00.000Z",
    valor_entrada: 0,
    valor_total: 2000,
    ...overrides,
  }) as Evento;

const daysFromTodayIso = (daysOffset: number, hour = 12) => {
  const date = getTodayAtNoon();
  date.setDate(date.getDate() + daysOffset);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

describe("commercial-activity", () => {
  it("conta leads novos nos últimos 7 dias", () => {
    const events = [
      baseEvent({ id: 1, created_at: daysFromTodayIso(0), status_interno: "ativo", etapa: "proposta_enviada" }),
      baseEvent({ id: 2, created_at: daysFromTodayIso(-6) }),
      baseEvent({ id: 3, created_at: daysFromTodayIso(-7) }),
      baseEvent({ id: 4, created_at: daysFromTodayIso(0), status_interno: "perdido", etapa: "perdido" }),
      baseEvent({
        id: 5,
        created_at: daysFromTodayIso(-20),
        updated_at: daysFromTodayIso(0),
        status_interno: "novo",
        etapa: "contato_inicial",
      }),
    ];

    // 1 e 4 (hoje), 2 (há 6 dias), 5 (reativado hoje) — 3 fica fora da janela
    expect(countNewLeadsLast7Days(events)).toBe(4);
  });

  it("monta cards de atividade comercial", () => {
    const events = [
      baseEvent({ id: 1, created_at: daysFromTodayIso(0), status_interno: "novo" }),
      baseEvent({ id: 2, created_at: daysFromTodayIso(-1) }),
      baseEvent({
        id: 3,
        created_at: daysFromTodayIso(-40),
        funil: "festa",
        updated_at: daysFromTodayIso(0),
        valor_total: 5000,
      }),
    ];

    const activity = buildCommercialActivity(events, [
      { accepted_at: daysFromTodayIso(0), evento_id: 3 },
    ]);

    expect(activity.cards[0]?.subtitle).toMatch(/Hoje entrou/);
    expect(activity.cards[1]?.title).toBe("Leads nos últimos 7 dias");
    expect(activity.cards[1]?.subtitle).toMatch(/Nos últimos 7 dias entraram/);
    expect(activity.cards[2]?.subtitle).toMatch(/Este mês entraram/);
    expect(activity.cards[3]?.title).toBe("Propostas enviadas");
    expect(activity.cards[3]?.subtitle).toMatch(/Este mês enviamos/);
    expect(activity.cards[3]?.subtitle).toMatch(/inclui leads de outros meses/);
    expect(activity.cards[4]?.subtitle).toMatch(/Este mês fechamos/);
    expect(activity.cards[5]?.subtitle).toMatch(/taxa de conversão/);
    expect(activity.cards[6]?.subtitle).toMatch(/Vendemos o valor de/);
  });

  it("conta propostas enviadas no mês via proposta_enviada_em", () => {
    const now = getTodayAtNoon();
    const thisMonthMid = new Date(now.getFullYear(), now.getMonth(), 1, 12, 0, 0, 0);
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15, 12, 0, 0, 0);

    const events = [
      baseEvent({
        id: 1,
        proposta_enviada_em: daysFromTodayIso(0),
        funil: "vendas",
        etapa: "proposta_enviada",
      }),
      baseEvent({
        id: 2,
        proposta_enviada_em: thisMonthMid.toISOString(),
        funil: "festa",
        etapa: "planejamento",
      }),
      baseEvent({
        id: 3,
        proposta_enviada_em: previousMonth.toISOString(),
        funil: "vendas",
        etapa: "proposta_enviada",
      }),
      baseEvent({
        id: 4,
        proposta_enviada_em: daysFromTodayIso(0),
        status_interno: "cancelado",
      }),
      baseEvent({ id: 5, proposta_enviada_em: null }),
    ];

    expect(countProposalsSentThisMonth(events)).toBe(2);
  });

  it("só conta festas com contrato assinado no mês e soma o valor_total delas", () => {
    const events = [
      baseEvent({
        id: 1,
        created_at: daysFromTodayIso(-5),
        funil: "vendas",
      }),
      baseEvent({
        id: 2,
        created_at: daysFromTodayIso(-200),
        funil: "festa",
        updated_at: daysFromTodayIso(0),
        valor_total: 4000,
      }),
      baseEvent({
        id: 3,
        created_at: daysFromTodayIso(-2),
        funil: "festa",
        updated_at: daysFromTodayIso(-2),
        valor_total: 9000,
      }),
      baseEvent({
        id: 4,
        created_at: daysFromTodayIso(-1),
        funil: "festa",
        updated_at: daysFromTodayIso(-1),
        valor_total: 1500,
      }),
    ];

    const activity = buildCommercialActivity(events, [
      { accepted_at: daysFromTodayIso(-3), evento_id: 2 },
      // festa migrada/criada manualmente no funil festa — sem contrato
    ]);

    const closedCard = activity.cards.find((card) => card.id === "closed-parties");
    const soldCard = activity.cards.find((card) => card.id === "sold-value");
    const conversionCard = activity.cards.find((card) => card.id === "conversion-rate");

    expect(closedCard?.countDisplay).toBe("1");
    expect(soldCard?.countDisplay).toBe("R$\u00a04.000");
    expect(conversionCard?.countDisplay).toBe("100%");
  });

  it("ignora contrato assinado fora do mês", () => {
    const events = [
      baseEvent({
        id: 1,
        created_at: daysFromTodayIso(-40),
        funil: "festa",
        valor_total: 3000,
      }),
    ];

    const activity = buildCommercialActivity(events, [
      { accepted_at: daysFromTodayIso(-40), evento_id: 1 },
    ]);

    expect(activity.cards.find((card) => card.id === "closed-parties")?.countDisplay).toBe("0");
    expect(activity.cards.find((card) => card.id === "sold-value")?.countDisplay).toBe("R$\u00a00");
  });

  it("conta leads novos no mês atual", () => {
    const now = getTodayAtNoon();
    const thisMonthMid = new Date(now.getFullYear(), now.getMonth(), 1, 12, 0, 0, 0);
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15, 12, 0, 0, 0);

    const events = [
      baseEvent({ id: 1, created_at: daysFromTodayIso(0), updated_at: daysFromTodayIso(0) }),
      baseEvent({
        id: 2,
        created_at: thisMonthMid.toISOString(),
        updated_at: thisMonthMid.toISOString(),
      }),
      baseEvent({
        id: 3,
        created_at: previousMonth.toISOString(),
        updated_at: previousMonth.toISOString(),
      }),
    ];

    expect(countNewLeadsThisMonth(events)).toBe(2);
  });
});
