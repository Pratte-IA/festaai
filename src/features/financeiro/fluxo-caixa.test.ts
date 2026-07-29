import { describe, expect, it } from "vitest";

import { buildDreStatement } from "./build-dre-statement";
import { getEventoCompetenciaInconsistencia, buildCompetenciaPeriodResult } from "./competencia";
import {
  buildFluxoCaixaEntradasFestas,
  computeFinanceiroPorFestaRecebido,
  computeFluxoCaixaRecebidoEvento,
  reconcileEventoCashReceived,
  shouldIncludeLedgerEntradaContrato,
} from "./fluxo-caixa";
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

describe("fluxo de caixa — estabilizacao", () => {
  it("cenario A — usa data real do recebimento, nao created_at nem fechamento", () => {
    const ledger = [
      lancamento({
        data_lancamento: "2026-07-10",
        valor: 500,
        referencia_id: 1,
      }),
    ];

    const entradas = buildFluxoCaixaEntradasFestas([], ledger);
    expect(entradas).toHaveLength(1);
    expect(entradas[0]?.data_lancamento).toBe("2026-07-10");
    expect(entradas[0]?.data_lancamento).not.toBe("2026-07-03");
    expect(entradas[0]?.data_lancamento).not.toBe("2026-07-05");
  });

  it("cenario B — parcelas nas datas reais sem duplicacao", () => {
    const ledger = [
      lancamento({ id: 1, data_lancamento: "2026-01-15", valor: 500, referencia_id: 1 }),
      lancamento({ id: 2, data_lancamento: "2026-02-15", valor: 1000, referencia_id: 2 }),
      lancamento({ id: 3, data_lancamento: "2026-03-15", valor: 1500, referencia_id: 3 }),
    ];

    const jan = buildFluxoCaixaEntradasFestas([], ledger.filter((l) => l.data_lancamento.startsWith("2026-01")));
    const fev = buildFluxoCaixaEntradasFestas([], ledger.filter((l) => l.data_lancamento.startsWith("2026-02")));
    const mar = buildFluxoCaixaEntradasFestas([], ledger.filter((l) => l.data_lancamento.startsWith("2026-03")));

    expect(jan.reduce((s, i) => s + i.valor, 0)).toBe(500);
    expect(fev.reduce((s, i) => s + i.valor, 0)).toBe(1000);
    expect(mar.reduce((s, i) => s + i.valor, 0)).toBe(1500);
    expect(buildFluxoCaixaEntradasFestas([], ledger)).toHaveLength(3);
  });

  it("cenario C — cancelamento posterior nao remove entrada historica do caixa", () => {
    const ledger = [lancamento({ data_lancamento: "2026-01-10", valor: 500 })];
    const entradas = buildFluxoCaixaEntradasFestas([], ledger);
    expect(entradas.reduce((s, i) => s + i.valor, 0)).toBe(500);

    const competencia = buildCompetenciaPeriodResult(
      "2026-03",
      [
        {
          aniversariante_nome: "X",
          cliente_nome: "Y",
          data_evento: "2026-03-15",
          funil: "festa",
          id: 1,
          pacote_nome: null,
          status_interno: "cancelado",
          valor_total: 5000,
        },
      ],
      [],
    );
    expect(competencia.summary.receitaFestas).toBe(0);
  });

  it("cenario D — devolucao aparece como saida na data do estorno", () => {
    const movimentos = [
      lancamento({ id: 1, data_lancamento: "2026-01-10", valor: 500, tipo: "entrada" }),
      lancamento({
        id: 2,
        data_lancamento: "2026-02-20",
        valor: 500,
        tipo: "saida",
        categoria: "outros",
        origem: "manual",
        referencia_id: null,
        referencia_tipo: null,
        descricao: "Devolucao de entrada",
      }),
    ];

    const entradasJan = buildFluxoCaixaEntradasFestas(
      [],
      movimentos.filter((m) => m.tipo === "entrada" && m.data_lancamento.startsWith("2026-01")),
    );
    const saidasFev = movimentos.filter((m) => m.tipo === "saida" && m.data_lancamento.startsWith("2026-02"));

    expect(entradasJan.reduce((s, i) => s + i.valor, 0)).toBe(500);
    expect(saidasFev.reduce((s, i) => s + i.valor, 0)).toBe(500);
    expect(500 - 500).toBe(0);
  });

  it("cenario E — pagamento sincronizado conta uma unica vez (somente ledger)", () => {
    const ledger = [
      lancamento({
        id: 99,
        valor: 500,
        referencia_tipo: "evento_pagamento",
        referencia_id: 7,
        origem: "pagamento",
      }),
    ];

    // Fluxo usa apenas ledger — nao soma evento_pagamentos em paralelo.
    const entradas = buildFluxoCaixaEntradasFestas([], ledger);
    expect(entradas).toHaveLength(1);
    expect(entradas.reduce((s, i) => s + i.valor, 0)).toBe(500);

    const reconciliacao = reconcileEventoCashReceived({
      eventoId: 1,
      valorEntrada: 0,
      pagamentosDetalhadosTotal: 500,
      ledgerPagamentosTotal: 500,
      ledgerEntradaContratoTotal: 0,
    });
    expect(reconciliacao.isReconciled).toBe(true);
    expect(reconciliacao.pagamentosSyncOk).toBe(true);
  });

  it("cenario F — valor_entrada legado com data estimada sinalizada", () => {
    const legado = [
      {
        clienteNome: "Maria",
        contractId: null,
        estimatedDate: true,
        eventoId: 10,
        id: 10,
        isLegacyEstimate: true as const,
        referenceAt: "2026-07-05",
        valorEntrada: 500,
      },
    ];

    const entradas = buildFluxoCaixaEntradasFestas(legado, []);
    expect(entradas).toHaveLength(1);
    expect(entradas[0]?.isLegacyEstimate).toBe(true);
    expect(entradas[0]?.origem).toBe("legado_valor_entrada");
    expect(entradas[0]?.data_lancamento).toBe("2026-07-05");
  });

  it("cenario F — nao duplica quando ledger entrada_contrato existe e ha valor_entrada", () => {
    expect(shouldIncludeLedgerEntradaContrato(500)).toBe(false);

    const entradas = buildFluxoCaixaEntradasFestas(
      [
        {
          clienteNome: "Maria",
          contractId: null,
          isLegacyEstimate: true,
          eventoId: 10,
          id: 10,
          referenceAt: "2026-07-05",
          valorEntrada: 500,
        },
      ],
      [
        lancamento({
          id: 2,
          categoria: "entrada_contrato",
          origem: "manual",
          valor: 500,
          evento_id: 10,
          referencia_id: null,
          referencia_tipo: null,
        }),
      ],
      new Map([[10, 500]]),
    );

    // Sinal legado + NAO o ledger entrada_contrato duplicado
    expect(entradas.filter((i) => i.categoria === "entrada_contrato")).toHaveLength(1);
    expect(entradas.reduce((s, i) => s + i.valor, 0)).toBe(500);
  });

  it("cenario G — festa passada no funil festa continua prevista com alerta", () => {
    const alerta = getEventoCompetenciaInconsistencia(
      {
        data_evento: "2026-01-10",
        funil: "festa",
        status_interno: "ativo",
      },
      "2026-07-29",
    );
    expect(alerta).toContain("ainda não foi marcado como executado");

    const result = buildCompetenciaPeriodResult(
      "2026-01",
      [
        {
          aniversariante_nome: "Ana",
          cliente_nome: "Cliente",
          data_evento: "2026-01-10",
          funil: "festa",
          id: 1,
          pacote_nome: null,
          status_interno: "ativo",
          valor_total: 8000,
        },
      ],
      [],
      { todayIso: "2026-07-29" },
    );

    expect(result.festas[0]?.situacao).toBe("Previsto");
    expect(result.festas[0]?.alertaInconsistencia).toBeTruthy();
  });

  it("cenario H — conciliacao por evento nao cruza tenants", () => {
    const tenantA = reconcileEventoCashReceived({
      eventoId: 1,
      valorEntrada: 500,
      pagamentosDetalhadosTotal: 1500,
      ledgerPagamentosTotal: 1500,
      ledgerEntradaContratoTotal: 0,
    });
    const tenantB = reconcileEventoCashReceived({
      eventoId: 99,
      valorEntrada: 999,
      pagamentosDetalhadosTotal: 0,
      ledgerPagamentosTotal: 0,
      ledgerEntradaContratoTotal: 0,
    });

    expect(tenantA.financeiroPorFestaTotal).toBe(2000);
    expect(tenantA.fluxoCaixaTotal).toBe(2000);
    expect(tenantA.isReconciled).toBe(true);
    expect(tenantB.fluxoCaixaTotal).toBe(999);
    expect(tenantA.eventoId).not.toBe(tenantB.eventoId);
  });

  it("evidencia conciliacao: financeiro por festa = fluxo de caixa", () => {
    expect(computeFinanceiroPorFestaRecebido(500, 1500)).toBe(2000);
    expect(computeFluxoCaixaRecebidoEvento(500, 1500, 0)).toBe(2000);
    expect(computeFluxoCaixaRecebidoEvento(500, 1500, 200)).toBe(2000); // entrada_contrato ignorada
  });

  it("DRE nao soma valor_entrada + entrada_contrato do mesmo evento", () => {
    const statement = buildDreStatement(
      [
        {
          referenceAt: "2026-07-05",
          clienteNome: "Maria",
          contractId: null,
          eventoId: 3,
          id: 3,
          isLegacyEstimate: true,
          valorEntrada: 5000,
        },
      ],
      [
        lancamento({
          id: 1,
          tipo: "entrada",
          origem: "manual",
          categoria: "entrada_contrato",
          valor: 5000,
          evento_id: 3,
          referencia_id: null,
          referencia_tipo: null,
        }),
        lancamento({ id: 2, tipo: "entrada", origem: "pagamento", categoria: "pagamento_contrato", valor: 2000 }),
      ],
      new Map([[3, 5000]]),
    );

    expect(statement.reservasTotal).toBe(5000);
    expect(statement.pagamentosSaldoTotal).toBe(2000);
  });
});
