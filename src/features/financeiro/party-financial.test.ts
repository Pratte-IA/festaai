import { describe, expect, it } from "vitest";

import {
  buildEventoFinanceiroSummary,
  computeEventMarginPercent,
  computeEventRevenueTotal,
} from "./party-financial";

describe("party-financial", () => {
  it("calcula receita total com contrato e upsells", () => {
    expect(computeEventRevenueTotal({ valor_total: 5000 }, 800)).toBe(5800);
  });

  it("calcula resultado e margem da festa", () => {
    const summary = buildEventoFinanceiroSummary(
      { valor_total: 5000 },
      [
        { origem: "upsell", tipo: "entrada", categoria: "adicional_contratado", valor: 500 },
        { origem: "manual", tipo: "saida", valor: 1200, categoria: "buffet_salgados" },
        { origem: "manual", tipo: "saida", valor: 300, categoria: "equipe" },
      ],
    );

    expect(summary.entradaTotal).toBe(5500);
    expect(summary.saidaTotal).toBe(1500);
    expect(summary.resultadoFesta).toBe(4000);
    expect(summary.margemPercent).toBeCloseTo(72.727, 2);
  });

  it("aplica descontos manuais no total a receber", () => {
    const summary = buildEventoFinanceiroSummary(
      { valor_total: 5000 },
      [
        { origem: "manual", tipo: "entrada", categoria: "adicional_contratado", valor: 800 },
        { origem: "manual", tipo: "entrada", categoria: "desconto", valor: -300 },
      ],
    );

    expect(summary.upsellTotal).toBe(800);
    expect(summary.descontoTotal).toBe(-300);
    expect(summary.entradaTotal).toBe(5500);
  });

  it("retorna margem nula quando nao ha receita", () => {
    expect(computeEventMarginPercent(0, 0)).toBeNull();
  });
});
