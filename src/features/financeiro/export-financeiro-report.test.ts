import { describe, expect, it } from "vitest";

import {
  buildFinanceiroReportCsv,
  buildFinanceiroReportPdfHtml,
  buildFinanceiroReportXls,
  getFinanceiroReportFilename,
} from "./export-financeiro-report";
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

const baseData = {
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
  saidasFestas: [] as FinanceiroDisplayItem[],
  saidasGerais: [
    displayItem({
      id: "lancamento-2",
      categoria: "impostos",
      tipo: "saida" as const,
      valor: 200,
    }),
  ],
  to: "2026-07-31",
};

describe("export-financeiro-report", () => {
  it("monta csv organizado com separador brasileiro e totais", () => {
    const csv = buildFinanceiroReportCsv(baseData);

    expect(csv).toContain("Relatório Financeiro - julho de 2026");
    expect(csv).toContain("Período;01/07/2026;31/07/2026");
    expect(csv).toContain("DRE - Demonstrativo do Resultado");
    expect(csv).toContain("Receita liquida;500,00");
    expect(csv).toContain("Entradas - Festas (automático)");
    expect(csv).toContain("origem_movimento;data_confirmada;observacao");
    expect(csv).toContain("Entrada Contrato;Maria;Contrato;Lançamento da festa;Sim;;400,00");
    expect(csv).toContain("Entradas - Empresa (manual)");
    expect(csv).toContain("Outras receitas;Venda avulsa;Geral;Entrada manual;Sim;;100,00");
    expect(csv).toContain("Total de entradas;;;;;;;500,00");
    expect(csv).toContain("Saídas - Empresa (manual)");
    expect(csv).toContain("Impostos;;Geral;Saída manual;Sim;;200,00");
  });

  it("permite exportar apenas secoes selecionadas", () => {
    const csv = buildFinanceiroReportCsv(baseData, {
      dre: false,
      entradas: true,
      saidas: false,
    });

    expect(csv).toContain("Entradas - Festas (automático)");
    expect(csv).not.toContain("DRE - Demonstrativo do Resultado");
    expect(csv).not.toContain("Saídas - Empresa (manual)");
  });

  it("gera planilha xls com abas por secao", () => {
    const xls = buildFinanceiroReportXls(baseData, {
      dre: true,
      entradas: false,
      saidas: false,
    });

    expect(xls).toContain('ss:Name="Capa"');
    expect(xls).toContain("DRE - Demonstrativo do Resultado");
    expect(xls).toContain('<Data ss:Type="Number">300</Data>');
    expect(xls).not.toContain("Entradas - Festas");
  });

  it("gera html de pdf com tabelas e periodo formatado", () => {
    const html = buildFinanceiroReportPdfHtml(baseData, {
      dre: false,
      entradas: false,
      saidas: true,
    });

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Período: 01/07/2026 a 31/07/2026");
    expect(html).toContain("Saídas - Empresa (manual)");
    expect(html).toContain("200,00");
    expect(html).not.toContain("DRE - Demonstrativo do Resultado");
  });

  it("gera nome de arquivo pelo mes e formato", () => {
    expect(getFinanceiroReportFilename("2026-07")).toBe("financeiro-2026-07.csv");
    expect(getFinanceiroReportFilename("2026-07", "xls")).toBe("financeiro-2026-07.xls");
    expect(getFinanceiroReportFilename("2026-07", "pdf")).toBe("financeiro-2026-07.pdf");
  });
});
