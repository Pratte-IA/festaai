import { describe, expect, it } from "vitest";

import { resolveFinanceiroLancamentoValor } from "./constants";
import { buildDrePeriodSummary } from "./build-dre-entradas";

describe("resolveFinanceiroLancamentoValor", () => {
  it("registra desconto como valor negativo", () => {
    expect(resolveFinanceiroLancamentoValor("desconto", 150)).toBe(-150);
    expect(resolveFinanceiroLancamentoValor("desconto", -150)).toBe(-150);
  });

  it("mantem entradas comuns positivas", () => {
    expect(resolveFinanceiroLancamentoValor("pagamento_contrato", 500)).toBe(500);
  });
});

describe("desconto no DRE", () => {
  it("reduz o total de entradas", () => {
    const summary = buildDrePeriodSummary(
      [
        {
          categoria: "entrada_contrato",
          data_lancamento: "2026-07-01",
          deletable: false,
          descricao: null,
          evento_id: 1,
          id: "c-1",
          origem: "contrato",
          tipo: "entrada",
          valor: 1000,
        },
        {
          categoria: "desconto",
          data_lancamento: "2026-07-02",
          deletable: true,
          descricao: null,
          evento_id: 1,
          id: "l-1",
          ledgerId: 1,
          origem: "manual",
          tipo: "entrada",
          valor: -200,
        },
      ],
      [],
    );

    expect(summary.entradas).toBe(800);
  });
});
