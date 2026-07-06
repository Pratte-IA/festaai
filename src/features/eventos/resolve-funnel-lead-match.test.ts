import { describe, expect, it } from "vitest";

import {
  findDuplicateVendasLeads,
  normalizeLeadNameForMatch,
  resolveFunnelLeadMatch,
  type FunnelLeadCandidate,
} from "./resolve-funnel-lead-match";

const baseLead = (
  overrides: Partial<FunnelLeadCandidate> & Pick<FunnelLeadCandidate, "id">,
): FunnelLeadCandidate => ({
  cliente_email: null,
  cliente_nome: "Cliente",
  cliente_telefone: null,
  etapa: "contato_inicial",
  funil: "vendas",
  status_interno: "novo",
  updated_at: "2026-07-05T12:00:00.000Z",
  ...overrides,
});

describe("resolveFunnelLeadMatch", () => {
  it("prioriza lead vinculado pelo eventoId", () => {
    const eventos = [
      baseLead({ id: 1, cliente_nome: "Camili", funil: "vendas" }),
      baseLead({ id: 2, cliente_nome: "Outra", funil: "festa" }),
    ];

    expect(
      resolveFunnelLeadMatch(eventos, {
        email: null,
        linkedEventoId: 1,
        name: "Camili",
        phone: "554599785617",
      }),
    ).toEqual({
      evento: eventos[0],
      source: "vendas",
    });
  });

  it("localiza lead de vendas pelo telefone", () => {
    const eventos = [
      baseLead({ id: 1, cliente_telefone: "554599785617" }),
      baseLead({ id: 2, funil: "festa", cliente_telefone: "554884038841" }),
    ];

    expect(
      resolveFunnelLeadMatch(eventos, {
        email: null,
        name: null,
        phone: "554599785617",
      }),
    ).toEqual({
      evento: eventos[0],
      source: "vendas",
    });
  });

  it("prioriza lead de vendas com o mesmo nome quando ha varios com o telefone", () => {
    const eventos = [
      baseLead({
        id: 1,
        cliente_nome: "Camili",
        cliente_telefone: "554599785617",
        updated_at: "2026-07-05T10:00:00.000Z",
      }),
      baseLead({
        id: 2,
        cliente_nome: "Maria",
        cliente_telefone: "554599785617",
        updated_at: "2026-07-06T12:00:00.000Z",
      }),
    ];

    expect(
      resolveFunnelLeadMatch(eventos, {
        email: null,
        name: "Camili",
        phone: "554599785617",
      }),
    ).toEqual({
      evento: eventos[0],
      source: "vendas",
    });
  });

  it("localiza lead de vendas pelo nome quando telefone nao bate", () => {
    const eventos = [baseLead({ id: 10, cliente_nome: "Camili" })];

    expect(
      resolveFunnelLeadMatch(eventos, {
        email: null,
        name: "Camili",
        phone: "554599785617",
      }),
    ).toEqual({
      evento: eventos[0],
      source: "vendas",
    });
  });

  it("nao usa nome quando ha mais de um lead de vendas com o mesmo nome", () => {
    const eventos = [
      baseLead({ id: 1, cliente_nome: "Camili" }),
      baseLead({ id: 2, cliente_nome: "Camili" }),
    ];

    expect(
      resolveFunnelLeadMatch(eventos, {
        email: null,
        name: "Camili",
        phone: null,
      }),
    ).toBeNull();
  });

  it("normaliza acentos e caixa no nome", () => {
    expect(normalizeLeadNameForMatch("  CAMÍLI  ")).toBe("camili");
  });
});

describe("findDuplicateVendasLeads", () => {
  it("lista outros leads de vendas com o mesmo nome", () => {
    const eventos = [
      baseLead({ id: 1, cliente_nome: "Camili" }),
      baseLead({ id: 99, funil: "festa", cliente_nome: "Camili" }),
    ];

    expect(
      findDuplicateVendasLeads(
        eventos,
        { email: null, name: "Camili", phone: "554599785617" },
        99,
      ),
    ).toEqual([eventos[0]]);
  });
});
