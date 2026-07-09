import { describe, expect, it } from "vitest";

import { buildFinanceiroReportCsv, getFinanceiroReportFilename } from "./export-financeiro-report";
import { DreStatement, FinanceiroDisplayItem } from "./display-types";

const displayItem = (
  overrides: Partial<FinanceiroDisplayItem> & Pick<FinanceiroDisplayItem, "id">,
): FinanceiroDisplayItem => ({
  categoria: "outras_receitas",
  data_lancamento: "2026-07-10",
  deletable: true,
  descricao: null,
  evento_id: null,
  origem: "manual",
  tipo: "entrada",
  valor: 100,
  ...overrides,
});

const dreStatement: DreStatement = {
  adicionaisTotal: 0,
  descontosTotal: 0,
  despesasTotal: 200,
  lines: [
    { id: "subtotal-receita-liquida", kind: "subtotal", label: "Receita liquida", level: 0, value: 500 },
    { id: "subtotal-despesas", kind: "subtotal", label: "Total de despesas", level: 0, value: 200 },
    { id: "total-resultado", kind: "total", label: "Resultado liquido do periodo", level: 0, value: 300 },
  ],
  outrasReceitasTotal: 500,
  pagamentosSaldoTotal: 0,
  receitaBruta: 500,
  receitaLiquida: 500,
  reservasTotal: 0,
  resultadoLiquido: 300,
};

describe("export-financeiro-report", () => {
  it("monta csv com dre e lancamentos", () => {
    const csv = buildFinanceiroReportCsv({
      dreStatement,
      entradasFestas: [
        displayItem({
          id: "contrato-1",
          categoria: "entrada_contrato",
          descricao: "Maria",
          evento_id: 12,
          origem: "contrato",
          valor: 400,
        }),
      ],
      entradasManuais: [
        displayItem({
          id: "lancamento-1",
          descricao: "Venda avulsa",
          valor: 100,
        }),
      ],
      from: "2026-07-01",
      month: "2026-07",
      saidasFestas: [],
      saidasGerais: [
        displayItem({
          id: "lancamento-2",
          categoria: "impostos",
          tipo: "saida",
          valor: 200,
        }),
      ],
      to: "2026-07-31",
    });

    expect(csv).toContain("Relatorio Financeiro - julho de 2026");
    expect(csv).toContain("DRE - Demonstrativo do Resultado");
    expect(csv).toContain("Receita liquida,500.00");
    expect(csv).toContain("Entradas - Festas (automatico)");
    expect(csv).toContain("Entrada Contrato,Maria,Contrato,400.00");
    expect(csv).toContain("Entradas - Empresa (manual)");
    expect(csv).toContain("Outras receitas,Venda avulsa,Geral,100.00");
    expect(csv).toContain("Saidas - Empresa (manual)");
    expect(csv).toContain("Impostos,,Geral,200.00");
  });

  it("gera nome de arquivo pelo mes", () => {
    expect(getFinanceiroReportFilename("2026-07")).toBe("financeiro-2026-07.csv");
  });
});
