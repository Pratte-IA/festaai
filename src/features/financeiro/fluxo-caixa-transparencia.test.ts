import { describe, expect, it } from "vitest";

import { buildDreStatement } from "./build-dre-statement";
import { buildSaidasFestas, buildSaidasGerais } from "./build-dre-entradas";
import { buildFinanceiroReportCsv } from "./export-financeiro-report";
import {
  buildFluxoCaixaEntradasFestas,
  buildFluxoCaixaEntradasSummary,
  filterFluxoCaixaByConfiabilidade,
  getFluxoCaixaExportMeta,
} from "./fluxo-caixa";
import { FinanceiroDisplayItem } from "./display-types";
import { FinanceiroLancamento } from "./types";

const lancamento = (overrides: Partial<FinanceiroLancamento>): FinanceiroLancamento =>
  ({
    categoria: "pagamento_contrato",
    created_at: "2026-07-10T00:00:00.000Z",
    created_by: null,
    data_competencia: "2026-07-01",
    data_lancamento: "2026-07-10",
    descricao: null,
    evento_id: 1,
    id: 1,
    observacao: null,
    origem: "pagamento",
    referencia_id: 10,
    referencia_tipo: "evento_pagamento",
    tenant_id: 1,
    tipo: "entrada",
    updated_at: "2026-07-10T00:00:00.000Z",
    updated_by: null,
    valor: 500,
    ...overrides,
  }) as FinanceiroLancamento;

const legado = (valor = 500, id = 10): Parameters<typeof buildFluxoCaixaEntradasFestas>[0][number] => ({
  clienteNome: "Maria",
  contractId: null,
  estimatedDate: true,
  eventoId: id,
  id,
  isLegacyEstimate: true,
  referenceAt: "2026-07-05",
  valorEntrada: valor,
});

describe("fluxo de caixa — transparencia e filtros", () => {
  it("periodo somente com movimentos confirmados", () => {
    const items = buildFluxoCaixaEntradasFestas([], [
      lancamento({ valor: 1000, data_lancamento: "2026-07-10" }),
    ]);
    const summary = buildFluxoCaixaEntradasSummary(items);

    expect(summary.confirmadasTotal).toBe(1000);
    expect(summary.legadasTotal).toBe(0);
    expect(summary.legadasCount).toBe(0);
    expect(summary.total).toBe(1000);
  });

  it("periodo somente com movimentos legados", () => {
    const items = buildFluxoCaixaEntradasFestas([legado(500)], []);
    const summary = buildFluxoCaixaEntradasSummary(items);

    expect(summary.confirmadasTotal).toBe(0);
    expect(summary.legadasTotal).toBe(500);
    expect(summary.legadasCount).toBe(1);
    expect(summary.total).toBe(500);
  });

  it("periodo misto separa confirmados e legados", () => {
    const items = buildFluxoCaixaEntradasFestas(
      [legado(500)],
      [lancamento({ valor: 1500, data_lancamento: "2026-07-12" })],
    );
    const summary = buildFluxoCaixaEntradasSummary(items);

    expect(summary.confirmadasTotal).toBe(1500);
    expect(summary.legadasTotal).toBe(500);
    expect(summary.total).toBe(2000);
  });

  it("filtro confirmados recalcula cards e tabela", () => {
    const items = buildFluxoCaixaEntradasFestas(
      [legado(500)],
      [lancamento({ valor: 1500 })],
    );
    const filtrados = filterFluxoCaixaByConfiabilidade(items, "confirmados");
    const summary = buildFluxoCaixaEntradasSummary(filtrados);

    expect(filtrados).toHaveLength(1);
    expect(summary.confirmadasTotal).toBe(1500);
    expect(summary.legadasTotal).toBe(0);
    expect(summary.total).toBe(1500);
  });

  it("filtro legados recalcula cards e tabela", () => {
    const items = buildFluxoCaixaEntradasFestas(
      [legado(500)],
      [lancamento({ valor: 1500 })],
    );
    const filtrados = filterFluxoCaixaByConfiabilidade(items, "legados");
    const summary = buildFluxoCaixaEntradasSummary(filtrados);

    expect(filtrados).toHaveLength(1);
    expect(summary.legadasTotal).toBe(500);
    expect(summary.confirmadasTotal).toBe(0);
    expect(summary.total).toBe(500);
  });

  it("exportacao identifica data estimada no legado", () => {
    const item: FinanceiroDisplayItem = {
      categoria: "entrada_contrato",
      data_lancamento: "2026-07-05",
      deletable: false,
      descricao: "Maria",
      evento_id: 10,
      id: "contrato-10",
      isLegacyEstimate: true,
      origem: "legado_valor_entrada",
      tipo: "entrada",
      valor: 500,
    };

    const meta = getFluxoCaixaExportMeta(item);
    expect(meta.origem_movimento).toBe("Sinal legado");
    expect(meta.data_confirmada).toBe("Não");
    expect(meta.observacao).toContain("Data estimada");

    const csv = buildFinanceiroReportCsv({
      dreStatement: {
        adicionaisTotal: 0,
        descontosTotal: 0,
        despesasTotal: 0,
        lines: [],
        outrasReceitasTotal: 0,
        pagamentosSaldoTotal: 0,
        receitaBruta: 500,
        receitaLiquida: 500,
        reservasTotal: 500,
        resultadoLiquido: 500,
      },
      entradasFestas: [item],
      entradasManuais: [],
      from: "2026-07-01",
      month: "2026-07",
      saidasFestas: [],
      saidasGerais: [],
      to: "2026-07-31",
    });

    expect(csv).toContain("origem_movimento");
    expect(csv).toContain("data_confirmada");
    expect(csv).toContain("Sinal legado");
    expect(csv).toContain("Não");
    expect(csv).toContain("Data estimada pelo fechamento/criação do evento");
  });

  it("devolucao aparece como saida", () => {
    const saidas = buildSaidasFestas([
      lancamento({
        id: 2,
        tipo: "saida",
        categoria: "devolucao_cliente",
        origem: "manual",
        valor: 500,
        descricao: "Devolucao parcial",
        referencia_id: null,
        referencia_tipo: null,
      }),
    ]);

    expect(saidas).toHaveLength(1);
    expect(saidas[0]?.tipo).toBe("saida");
    expect(saidas[0]?.categoria).toBe("devolucao_cliente");
    expect(saidas[0]?.valor).toBe(500);
  });

  it("estorno aparece como saida", () => {
    const saidas = buildSaidasGerais([
      lancamento({
        id: 3,
        tipo: "saida",
        categoria: "estorno",
        origem: "manual",
        evento_id: null,
        valor: 200,
        referencia_id: null,
        referencia_tipo: null,
      }),
    ]);

    expect(saidas).toHaveLength(1);
    expect(saidas[0]?.categoria).toBe("estorno");
    expect(saidas[0]?.tipo).toBe("saida");
  });

  it("adicional do fechamento no valor_total nao e duplicado no DRE do caixa", () => {
    // valor_total vigente = 5500 (pacote 5000 + adicional do fechamento 500).
    // O DRE de caixa NAO usa valor_total — so ledger.
    // Adicional posterior no ledger = 300 → deve aparecer uma unica vez.
    const statement = buildDreStatement(
      [],
      [
        lancamento({
          id: 1,
          tipo: "entrada",
          origem: "manual",
          categoria: "adicional_contratado",
          valor: 300,
          referencia_id: null,
          referencia_tipo: null,
        }),
        lancamento({
          id: 2,
          tipo: "entrada",
          origem: "pagamento",
          categoria: "pagamento_contrato",
          valor: 2000,
        }),
      ],
    );

    expect(statement.adicionaisTotal).toBe(300);
    expect(statement.pagamentosSaldoTotal).toBe(2000);
    expect(statement.receitaBruta).toBe(2300);
    expect(statement.lines.filter((line) => line.label === "Adicionais contratados")).toHaveLength(1);
  });

  it("retencao de sinal/multa e entrada classificavel", () => {
    const statement = buildDreStatement(
      [],
      [
        lancamento({
          id: 4,
          tipo: "entrada",
          origem: "manual",
          categoria: "retencao_sinal_multa",
          valor: 250,
          referencia_id: null,
          referencia_tipo: null,
        }),
      ],
    );

    // Entra como adicional/receita de festa (nao e pagamento_contrato nem desconto).
    expect(statement.adicionaisTotal).toBe(250);
  });
});
