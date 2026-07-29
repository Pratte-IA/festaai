import { describe, expect, it } from "vitest";

import {
  applyCompetenciaFilters,
  buildCompetenciaPeriodResult,
  computeCompetenciaReceitaFesta,
  getEventCompetenciaSituacao,
  isEventEligibleForCompetencia,
  toCompetenciaMonthStart,
} from "./competencia";

const festaMarco = {
  aniversariante_nome: "Ana",
  cliente_nome: "Cliente Ana",
  data_evento: "2026-03-15",
  funil: "festa" as const,
  id: 1,
  pacote_nome: "Premium",
  status_interno: "ativo" as const,
  valor_total: 5000,
};

describe("competencia financeira — auditoria", () => {
  it("reconhece competencia como primeiro dia do mes", () => {
    expect(toCompetenciaMonthStart("2026-03-15")).toBe("2026-03-01");
  });

  it("exclui leads, orcamentos, cancelados e sem data", () => {
    expect(
      isEventEligibleForCompetencia({
        data_evento: "2026-03-01",
        funil: "vendas",
        status_interno: "ativo",
      }),
    ).toBe(false);

    expect(
      isEventEligibleForCompetencia({
        data_evento: "2026-03-01",
        funil: "festa",
        status_interno: "cancelado",
      }),
    ).toBe(false);

    expect(
      isEventEligibleForCompetencia({
        data_evento: "2026-03-01",
        funil: "executadas",
        status_interno: "perdido",
      }),
    ).toBe(false);

    expect(
      isEventEligibleForCompetencia({
        data_evento: null,
        funil: "festa",
        status_interno: "ativo",
      }),
    ).toBe(false);

    expect(isEventEligibleForCompetencia(festaMarco)).toBe(true);
  });

  it("previsto x realizado usa funil executadas, nao so a data", () => {
    expect(getEventCompetenciaSituacao({ funil: "festa" })).toBe("Previsto");
    expect(getEventCompetenciaSituacao({ funil: "executadas" })).toBe("Realizado");
  });

  it("cenario obrigatorio: receita integral em marco, zero em jan/fev", () => {
    const lancamentos = [
      {
        categoria: "pagamento_contrato",
        data_competencia: "2026-03-01",
        data_lancamento: "2026-01-10",
        descricao: "Entrada",
        evento_id: 1,
        id: 10,
        origem: "pagamento" as const,
        tipo: "entrada" as const,
        valor: 2000,
      },
      {
        categoria: "pagamento_contrato",
        data_competencia: "2026-03-01",
        data_lancamento: "2026-02-10",
        descricao: "Parcela",
        evento_id: 1,
        id: 11,
        origem: "pagamento" as const,
        tipo: "entrada" as const,
        valor: 1500,
      },
      {
        categoria: "pagamento_contrato",
        data_competencia: "2026-03-01",
        data_lancamento: "2026-03-05",
        descricao: "Parcela",
        evento_id: 1,
        id: 12,
        origem: "pagamento" as const,
        tipo: "entrada" as const,
        valor: 1500,
      },
      {
        categoria: "buffet_salgados",
        data_competencia: "2026-03-01",
        data_lancamento: "2026-02-20",
        descricao: "Buffet",
        evento_id: 1,
        id: 13,
        origem: "manual" as const,
        tipo: "saida" as const,
        valor: 2000,
      },
    ];

    const janeiro = buildCompetenciaPeriodResult("2026-01", [festaMarco], lancamentos);
    expect(janeiro.summary.receitaFestas).toBe(0);

    const fevereiro = buildCompetenciaPeriodResult("2026-02", [festaMarco], lancamentos);
    expect(fevereiro.summary.receitaFestas).toBe(0);

    const marco = buildCompetenciaPeriodResult("2026-03", [festaMarco], lancamentos);
    expect(marco.summary.receitaFestas).toBe(5000);
    expect(marco.summary.custosDiretos).toBe(2000);
    expect(marco.summary.lucroBruto).toBe(3000);
    expect(marco.summary.previsto.receitaFestas).toBe(5000);
    expect(marco.summary.realizado.receitaFestas).toBe(0);
    expect(marco.festas[0]?.margemPercent).toBe(60);
    expect(marco.festas[0]?.situacao).toBe("Previsto");
  });

  it("cenario A — despesa de festa usa data_competencia, nao o mes da festa nem o pagamento", () => {
    const lancamentos = [
      {
        categoria: "decoracao",
        data_competencia: "2026-02-01",
        data_lancamento: "2026-02-10",
        descricao: "Decoracao competencia fev",
        evento_id: 1,
        id: 1,
        origem: "manual" as const,
        tipo: "saida" as const,
        valor: 1000,
      },
    ];

    const fevereiro = buildCompetenciaPeriodResult("2026-02", [festaMarco], lancamentos);
    expect(fevereiro.summary.receitaFestas).toBe(0);
    expect(fevereiro.summary.custosDiretos).toBe(1000);
    expect(fevereiro.custosDiretos).toHaveLength(1);
    expect(fevereiro.festas).toHaveLength(0);

    const marco = buildCompetenciaPeriodResult("2026-03", [festaMarco], lancamentos);
    expect(marco.summary.receitaFestas).toBe(5000);
    expect(marco.summary.custosDiretos).toBe(0);
    expect(marco.festas[0]?.custosDiretos).toBe(0);
    expect(marco.summary.lucroBruto).toBe(5000);
  });

  it("cenario A2 — cartao: compra/competencia em jul, pagamento em ago", () => {
    const lancamentos = [
      {
        categoria: "decoracao",
        data_competencia: "2026-07-01",
        data_lancamento: "2026-08-15",
        descricao: "Material no cartao",
        evento_id: 1,
        id: 1,
        origem: "manual" as const,
        tipo: "saida" as const,
        valor: 800,
      },
    ];

    const julho = buildCompetenciaPeriodResult("2026-07", [festaMarco], lancamentos);
    expect(julho.summary.custosDiretos).toBe(800);

    const agosto = buildCompetenciaPeriodResult("2026-08", [festaMarco], lancamentos);
    expect(agosto.summary.custosDiretos).toBe(0);
  });

  it("cenario B — despesa operacional usa data_competencia, nao data_lancamento", () => {
    const result = buildCompetenciaPeriodResult(
      "2026-03",
      [],
      [
        {
          categoria: "gastos_fixos",
          data_competencia: "2026-03-01",
          data_lancamento: "2026-04-05",
          descricao: "Aluguel",
          evento_id: null,
          id: 99,
          origem: "manual",
          tipo: "saida",
          valor: 4500,
        },
        {
          categoria: "outras_receitas",
          data_competencia: "2026-03-01",
          data_lancamento: "2026-03-01",
          descricao: "Receita geral nao deve entrar",
          evento_id: null,
          id: 100,
          origem: "manual",
          tipo: "entrada",
          valor: 999,
        },
      ],
    );

    expect(result.summary.despesasOperacionais).toBe(4500);
    expect(result.despesasOperacionais).toHaveLength(1);

    const abril = buildCompetenciaPeriodResult(
      "2026-04",
      [],
      [
        {
          categoria: "gastos_fixos",
          data_competencia: "2026-03-01",
          data_lancamento: "2026-04-05",
          descricao: "Aluguel",
          evento_id: null,
          id: 99,
          origem: "manual",
          tipo: "saida",
          valor: 4500,
        },
      ],
    );
    expect(abril.summary.despesasOperacionais).toBe(0);
  });

  it("cenario C — festa cancelada nao compoe receita", () => {
    const result = buildCompetenciaPeriodResult(
      "2026-03",
      [
        {
          ...festaMarco,
          status_interno: "cancelado",
        },
      ],
      [],
    );

    expect(result.summary.receitaFestas).toBe(0);
    expect(result.festas).toHaveLength(0);
  });

  it("cenario D — festa futura contratada aparece como previsto", () => {
    const result = buildCompetenciaPeriodResult(
      "2026-12",
      [
        {
          ...festaMarco,
          data_evento: "2026-12-20",
          funil: "festa",
          valor_total: 8000,
        },
      ],
      [],
    );

    expect(result.summary.receitaFestas).toBe(8000);
    expect(result.summary.previsto.receitaFestas).toBe(8000);
    expect(result.summary.realizado.receitaFestas).toBe(0);
    expect(result.festas[0]?.situacao).toBe("Previsto");
  });

  it("cenario E — isolamento por tenant nos dados agregados", () => {
    const eventosTenantA = [festaMarco];
    const eventosTenantB = [
      {
        ...festaMarco,
        id: 99,
        cliente_nome: "Outro Tenant",
        valor_total: 99999,
      },
    ];

    const resultA = buildCompetenciaPeriodResult("2026-03", eventosTenantA, []);
    const resultB = buildCompetenciaPeriodResult("2026-03", eventosTenantB, []);

    expect(resultA.summary.receitaFestas).toBe(5000);
    expect(resultB.summary.receitaFestas).toBe(99999);
    expect(resultA.festas.every((f) => f.eventoId === 1)).toBe(true);
    expect(resultB.festas.every((f) => f.eventoId === 99)).toBe(true);
  });

  it("cenario F — valor_total zero nao quebra margem", () => {
    const result = buildCompetenciaPeriodResult(
      "2026-03",
      [{ ...festaMarco, valor_total: 0 }],
      [],
    );

    expect(result.summary.receitaFestas).toBe(0);
    expect(result.summary.margemLiquidaPercent).toBeNull();
    expect(result.festas[0]?.margemPercent).toBeNull();
    expect(result.festas[0]?.semReceitaCadastral).toBe(true);
  });

  it("receita vigente inclui adicionais e descontos do ledger, nao recebimentos", () => {
    const receita = computeCompetenciaReceitaFesta({ valor_total: 5000 }, [
      {
        categoria: "adicional_contratado",
        data_competencia: "2026-03-01",
        data_lancamento: "2026-01-01",
        descricao: "Extra",
        evento_id: 1,
        id: 1,
        origem: "manual",
        tipo: "entrada",
        valor: 500,
      },
      {
        categoria: "desconto",
        data_competencia: "2026-03-01",
        data_lancamento: "2026-01-02",
        descricao: "Desconto",
        evento_id: 1,
        id: 2,
        origem: "manual",
        tipo: "entrada",
        valor: -200,
      },
      {
        categoria: "pagamento_contrato",
        data_competencia: "2026-03-01",
        data_lancamento: "2026-01-03",
        descricao: "Pagamento nao entra na receita",
        evento_id: 1,
        id: 3,
        origem: "pagamento",
        tipo: "entrada",
        valor: 2000,
      },
    ]);

    expect(receita.valorContratado).toBe(5300);
  });

  it("cards batem com as linhas apos filtro de situacao", () => {
    const built = buildCompetenciaPeriodResult(
      "2026-03",
      [
        festaMarco,
        {
          ...festaMarco,
          id: 2,
          funil: "executadas",
          aniversariante_nome: "Bia",
          cliente_nome: "Cliente Bia",
          valor_total: 3000,
        },
      ],
      [
        {
          categoria: "equipe",
          data_competencia: "2026-03-01",
          data_lancamento: "2026-03-01",
          descricao: "Equipe",
          evento_id: 2,
          id: 1,
          origem: "manual",
          tipo: "saida",
          valor: 500,
        },
      ],
    );

    const filtrado = applyCompetenciaFilters(built, { statusFilter: "Realizado" });
    expect(filtrado.festas).toHaveLength(1);
    expect(filtrado.summary.receitaFestas).toBe(3000);
    expect(filtrado.summary.custosDiretos).toBe(500);
    expect(filtrado.summary.lucroBruto).toBe(2500);
    expect(filtrado.summary.realizado.receitaFestas).toBe(3000);
    expect(filtrado.summary.previsto.receitaFestas).toBe(0);
  });

  it("despesa operacional sem data_competencia nao entra", () => {
    const result = buildCompetenciaPeriodResult(
      "2026-03",
      [],
      [
        {
          categoria: "gastos_fixos",
          data_competencia: null,
          data_lancamento: "2026-03-01",
          descricao: "Sem competencia",
          evento_id: null,
          id: 1,
          origem: "manual",
          tipo: "saida",
          valor: 100,
        },
      ],
    );

    expect(result.summary.despesasOperacionais).toBe(0);
  });
});
