import { describe, expect, it } from "vitest";

import { buildDreEntradas, buildDrePeriodSummary } from "./build-dre-entradas";
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
  it("inclui contratos pela data de assinatura e exclui pagamentos do DRE", () => {
    const entradas = buildDreEntradas(
      [
        {
          acceptedAt: "2026-07-05T15:30:00.000Z",
          clienteNome: "Maria",
          contractId: 10,
          eventoId: 3,
          id: 99,
          valorEntrada: 5000,
        },
      ],
      [
        lancamento({ id: 1, origem: "pagamento", categoria: "pagamento", valor: 1000 }),
        lancamento({ id: 2, origem: "upsell", valor: 800 }),
      ],
    );

    expect(entradas).toHaveLength(2);
    expect(entradas.some((item) => item.origem === "contrato" && item.valor === 5000)).toBe(true);
    expect(entradas.some((item) => item.origem === "pagamento")).toBe(false);
    expect(entradas.some((item) => item.origem === "upsell" && item.valor === 800)).toBe(true);
  });

  it("calcula resultado do DRE com contratos e saidas", () => {
    const entradas = buildDreEntradas(
      [{ acceptedAt: "2026-07-01T10:00:00.000Z", clienteNome: "Joao", contractId: 1, eventoId: 1, id: 1, valorEntrada: 1000 }],
      [],
    );
    const saidas = [{ categoria: "aluguel", valor: 1200 }] as const;

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
