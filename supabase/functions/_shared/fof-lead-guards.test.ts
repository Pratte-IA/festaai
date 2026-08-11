import { describe, expect, it } from "vitest";

import {
  hasVendasLeadBlockingFof,
  isVendasLeadBlockingFof,
  pickCanonicalOportunidadeFuturaId,
  selectFofDispatchEligibleIds,
} from "./fof-lead-guards.ts";

describe("isVendasLeadBlockingFof", () => {
  it("bloqueia qualquer vendas não cancelado", () => {
    expect(isVendasLeadBlockingFof({ status_interno: "novo" })).toBe(true);
    expect(isVendasLeadBlockingFof({ status_interno: "perdido" })).toBe(true);
    expect(isVendasLeadBlockingFof({ status_interno: "ativo" })).toBe(true);
  });

  it("não bloqueia cancelado", () => {
    expect(isVendasLeadBlockingFof({ status_interno: "cancelado" })).toBe(false);
  });
});

describe("hasVendasLeadBlockingFof", () => {
  it("detecta mesmo telefone com variações de formato", () => {
    expect(
      hasVendasLeadBlockingFof("554884151102", [
        { cliente_telefone: "4884151102", status_interno: "novo", tenant_id: 2 },
      ]),
    ).toBe(true);
  });

  it("ignora cancelado e outro tenant", () => {
    expect(
      hasVendasLeadBlockingFof(
        "554884151102",
        [{ cliente_telefone: "554884151102", status_interno: "cancelado", tenant_id: 2 }],
        2,
      ),
    ).toBe(false);

    expect(
      hasVendasLeadBlockingFof(
        "554884151102",
        [{ cliente_telefone: "554884151102", status_interno: "novo", tenant_id: 9 }],
        2,
      ),
    ).toBe(false);
  });
});

describe("pickCanonicalOportunidadeFuturaId", () => {
  it("escolhe a festa mais recente e, em empate, o maior id", () => {
    expect(
      pickCanonicalOportunidadeFuturaId([
        { id: 734, data_evento: "2024-10-20" },
        { id: 773, data_evento: "2025-10-13" },
      ]),
    ).toBe(773);

    expect(
      pickCanonicalOportunidadeFuturaId([
        { id: 10, data_evento: "2024-10-20" },
        { id: 20, data_evento: "2024-10-20" },
      ]),
    ).toBe(20);
  });
});

describe("selectFofDispatchEligibleIds", () => {
  const of734 = {
    id: 734,
    tenant_id: 2,
    cliente_telefone: "554884151102",
    data_evento: "2024-10-20",
  };
  const of773 = {
    id: 773,
    tenant_id: 2,
    cliente_telefone: "554884151102",
    data_evento: "2025-10-13",
  };

  it("com vendas ativo no telefone, nenhum OF é elegível", () => {
    const result = selectFofDispatchEligibleIds([of734, of773], [
      { cliente_telefone: "554884151102", status_interno: "novo", tenant_id: 2 },
    ]);

    expect(result.eligibleIds).toEqual([]);
    expect(result.skipped.map((s) => s.reason)).toEqual([
      "vendas_ativo_mesmo_telefone",
      "vendas_ativo_mesmo_telefone",
    ]);
  });

  it("sem vendas, só o OF canônico (festa mais recente) é elegível", () => {
    const result = selectFofDispatchEligibleIds([of734, of773], []);

    expect(result.eligibleIds).toEqual([773]);
    expect(result.skipped).toEqual([
      { eventoId: 734, reason: "oportunidade_futura_nao_canonica" },
    ]);
  });

  it("vendas cancelado não bloqueia FOF", () => {
    const result = selectFofDispatchEligibleIds([of773], [
      { cliente_telefone: "554884151102", status_interno: "cancelado", tenant_id: 2 },
    ]);

    expect(result.eligibleIds).toEqual([773]);
    expect(result.skipped).toEqual([]);
  });
});
