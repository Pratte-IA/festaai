import { describe, expect, it } from "vitest";

import { buildDashboardEntradaRows, buildDashboardSaidaRows } from "./dre-utils";

describe("buildDashboardDescricaoRows", () => {
  it("lista todas as descricoes de entrada com zero quando vazias", () => {
    const rows = buildDashboardEntradaRows([]);

    expect(rows).toHaveLength(1);
    expect(rows.find((row) => row.label === "Entrada Contrato")?.total).toBe(0);
  });

  it("preenche totais por descricao de saida", () => {
    const rows = buildDashboardSaidaRows([
      { categoria: "buffet_salgados", valor: 100 },
      { categoria: "gastos_fixos", valor: 250 },
    ]);

    expect(rows.find((row) => row.label === "Buffet - Salgados")?.total).toBe(100);
    expect(rows.find((row) => row.label === "Gastos Fixos")?.total).toBe(250);
    expect(rows.find((row) => row.label === "Decoração")?.total).toBe(0);
  });
});
