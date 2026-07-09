import { describe, expect, it } from "vitest";

import { buildDreEntradas, buildDrePeriodSummary, buildEntradasManuaisGerais, buildSaidasFestas, buildSaidasGerais } from "./build-dre-entradas";
import { FinanceiroLancamento } from "./types";

const lancamento = (overrides: Partial<FinanceiroLancamento>): FinanceiroLancamento =>
  ({
    categoria: "upsell",
    data_lancamento: "2026-07-10",
    descricao: null,
    evento_id: 1,
    id: 1,
    observacao: null,
    origem: "upsell",
    referencia_id: null,
    referencia_tipo: null,
    tenant_id: 1,
    tipo: "entrada",
    valor: 500,
    ...overrides,
  }) as FinanceiroLancamento;

describe("build-dre-entradas", () => {
  it("inclui apenas entradas de contrato assinado", () => {
    const entradas = buildDreEntradas([
      {
        acceptedAt: "2026-07-05T15:30:00.000Z",
        clienteNome: "Maria",
        contractId: 10,
        eventoId: 3,
        id: 99,
        valorEntrada: 5000,
      },
    ]);

    expect(entradas).toHaveLength(1);
    expect(entradas[0]).toMatchObject({
      categoria: "entrada_contrato",
      origem: "contrato",
      valor: 5000,
    });
  });

  it("nao inclui lancamentos manuais ou pagamentos de saldo", () => {
    const entradas = buildDreEntradas([
      {
        acceptedAt: "2026-07-05T15:30:00.000Z",
        clienteNome: "Maria",
        contractId: 10,
        eventoId: 3,
        id: 99,
        valorEntrada: 5000,
      },
    ]);

    expect(entradas).toHaveLength(1);
    expect(entradas.some((item) => item.categoria === "adicional_contratado")).toBe(false);
    expect(entradas.some((item) => item.origem === "pagamento")).toBe(false);
  });

  it("separa entradas e saidas por origem festa vs empresa", () => {
    const lancamentos = [
      lancamento({ id: 1, tipo: "entrada", origem: "manual", evento_id: null, categoria: "outras_receitas", valor: 150 }),
      lancamento({ id: 2, tipo: "entrada", origem: "manual", evento_id: 5, categoria: "adicional_contratado", valor: 800 }),
      lancamento({ id: 3, tipo: "saida", evento_id: null, categoria: "gastos_fixos", valor: 200 }),
      lancamento({ id: 4, tipo: "saida", evento_id: 5, categoria: "equipe", valor: 300 }),
    ];

    expect(buildEntradasManuaisGerais(lancamentos)).toHaveLength(1);
    expect(buildSaidasGerais(lancamentos)).toHaveLength(1);
    expect(buildSaidasFestas(lancamentos)).toHaveLength(1);
  });

  it("calcula resultado do DRE com contratos e saidas", () => {
    const entradas = buildDreEntradas([
      {
        acceptedAt: "2026-07-01T10:00:00.000Z",
        clienteNome: "Joao",
        contractId: 1,
        eventoId: 1,
        id: 1,
        valorEntrada: 1000,
      },
    ]);
    const saidas = [{ categoria: "gastos_fixos", valor: 1200 }] as const;

    const summary = buildDrePeriodSummary(
      entradas,
      saidas.map((item, index) => ({
        categoria: item.categoria,
        data_lancamento: "2026-07-02",
        deletable: true,
        descricao: null,
        evento_id: null,
        id: `saida-${index}`,
        origem: "manual",
        tipo: "saida" as const,
        valor: item.valor,
      })),
    );

    expect(summary.entradas).toBe(1000);
    expect(summary.saidas).toBe(1200);
    expect(summary.resultado).toBe(-200);
  });
});
