import { describe, expect, it } from "vitest";

import { Evento } from "@/features/eventos";

import {
  countNewLeadsToday,
  isBrandNewLeadContactToday,
  isNewLeadContactToday,
  isRecoveredLeadContactToday,
} from "./count-new-leads-today";

const today = new Date(2026, 6, 1, 12, 0, 0, 0);

const baseEvento = (overrides: Partial<Evento> = {}): Evento =>
  ({
    id: 1,
    tenant_id: 1,
    cliente_nome: "Maria",
    funil: "vendas",
    etapa: "contato_inicial",
    status_interno: "novo",
    created_at: "2026-07-01T14:00:00.000Z",
    updated_at: "2026-07-01T14:00:00.000Z",
    ...overrides,
  }) as Evento;

describe("count-new-leads-today", () => {
  it("conta lead novo criado hoje via contato inbound", () => {
    const evento = baseEvento();

    expect(isBrandNewLeadContactToday(evento, today)).toBe(true);
    expect(isNewLeadContactToday(evento, today)).toBe(true);
  });

  it("conta lead criado hoje mesmo apos avancar no funil", () => {
    const evento = baseEvento({
      etapa: "proposta_enviada",
      status_interno: "ativo",
    });

    expect(isBrandNewLeadContactToday(evento, today)).toBe(true);
    expect(isNewLeadContactToday(evento, today)).toBe(true);
  });

  it("conta lead recuperado de perdido hoje", () => {
    const evento = baseEvento({
      created_at: "2026-06-10T10:00:00.000Z",
      updated_at: "2026-07-01T09:30:00.000Z",
    });

    expect(isRecoveredLeadContactToday(evento, today)).toBe(true);
    expect(isNewLeadContactToday(evento, today)).toBe(true);
  });

  it("ignora lead ja existente no funil atualizado hoje", () => {
    const evento = baseEvento({
      created_at: "2026-06-10T10:00:00.000Z",
      status_interno: "ativo",
      updated_at: "2026-07-01T09:30:00.000Z",
    });

    expect(isNewLeadContactToday(evento, today)).toBe(false);
  });

  it("ignora lead novo de outro dia", () => {
    const evento = baseEvento({
      created_at: "2026-06-30T10:00:00.000Z",
      updated_at: "2026-06-30T10:00:00.000Z",
    });

    expect(isNewLeadContactToday(evento, today)).toBe(false);
  });

  it("ignora eventos fora do funil de vendas", () => {
    const evento = baseEvento({ funil: "festa" });

    expect(isNewLeadContactToday(evento, today)).toBe(false);
  });

  it("conta lead criado hoje mesmo ja marcado como perdido", () => {
    const evento = baseEvento({
      etapa: "perdido",
      status_interno: "perdido",
    });

    expect(isBrandNewLeadContactToday(evento, today)).toBe(true);
    expect(isNewLeadContactToday(evento, today)).toBe(true);
  });

  it("ignora lead cancelado criado hoje", () => {
    const evento = baseEvento({
      status_interno: "cancelado",
    });

    expect(isNewLeadContactToday(evento, today)).toBe(false);
  });

  it("agrega novos e recuperados no total do dia", () => {
    const eventos = [
      baseEvento({ id: 1 }),
      baseEvento({
        id: 2,
        created_at: "2026-06-05T08:00:00.000Z",
        updated_at: "2026-07-01T11:00:00.000Z",
      }),
      baseEvento({
        id: 3,
        created_at: "2026-06-20T08:00:00.000Z",
        status_interno: "ativo",
        updated_at: "2026-07-01T11:00:00.000Z",
      }),
    ];

    expect(countNewLeadsToday(eventos, today)).toBe(2);
  });

  it("conta lead criado hoje mesmo apos avancar no funil no agregador diario", () => {
    const eventos = [
      baseEvento({
        id: 1,
        etapa: "proposta_enviada",
        status_interno: "ativo",
      }),
    ];

    expect(countNewLeadsToday(eventos, today)).toBe(1);
  });
});
