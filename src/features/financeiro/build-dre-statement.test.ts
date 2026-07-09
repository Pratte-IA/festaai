import { describe, expect, it } from "vitest";

import { buildDreStatement } from "./build-dre-statement";
import { FinanceiroLancamento } from "./types";

const lancamento = (overrides: Partial<FinanceiroLancamento>): FinanceiroLancamento =>
  ({
    categoria: "gastos_fixos",
    data_lancamento: "2026-07-10",
    descricao: null,
    evento_id: 1,
    id: 1,
    observacao: null,
    origem: "manual",
    referencia_id: null,
    referencia_tipo: null,
    tenant_id: 1,
    tipo: "saida",
    valor: 100,
    ...overrides,
  }) as FinanceiroLancamento;

describe("buildDreStatement", () => {
  it("monta DRE com receitas, deducoes, despesas e resultado", () => {
    const statement = buildDreStatement(
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
        lancamento({ id: 1, tipo: "entrada", origem: "pagamento", categoria: "pagamento_contrato", valor: 2000 }),
        lancamento({
          id: 2,
          tipo: "entrada",
          origem: "manual",
          categoria: "adicional_contratado",
          valor: 800,
        }),
        lancamento({ id: 3, tipo: "entrada", origem: "manual", categoria: "desconto", valor: -300 }),
        lancamento({ id: 4, categoria: "marketing", valor: 400 }),
        lancamento({ id: 5, categoria: "equipe", valor: 600 }),
      ],
    );

    expect(statement.reservasTotal).toBe(5000);
    expect(statement.pagamentosSaldoTotal).toBe(2000);
    expect(statement.adicionaisTotal).toBe(800);
    expect(statement.receitaBruta).toBe(7800);
    expect(statement.descontosTotal).toBe(-300);
    expect(statement.receitaLiquida).toBe(7500);
    expect(statement.despesasTotal).toBe(1000);
    expect(statement.resultadoLiquido).toBe(6500);
    expect(statement.lines.some((line) => line.label === "Resultado liquido do periodo")).toBe(true);
  });
});
