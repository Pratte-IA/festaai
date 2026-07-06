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
        { origem: "upsell", tipo: "entrada", valor: 500 },
        { origem: "manual", tipo: "saida", valor: 1200 },
        { origem: "manual", tipo: "saida", valor: 300 },
      ],
    );

    expect(summary.entradaTotal).toBe(5500);
    expect(summary.saidaTotal).toBe(1500);
    expect(summary.resultadoFesta).toBe(4000);
    expect(summary.margemPercent).toBeCloseTo(72.727, 2);
  });

  it("retorna margem nula quando nao ha receita", () => {
    expect(computeEventMarginPercent(0, 0)).toBeNull();
  });
});
