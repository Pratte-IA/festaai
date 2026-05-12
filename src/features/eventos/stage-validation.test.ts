import { describe, expect, it } from "vitest";

import { getDefaultStageForFunnel, isStageValidForFunnel } from "./stage-validation";

describe("stage-validation", () => {
  it("retorna a primeira etapa como padrao para cada funil", () => {
    expect(getDefaultStageForFunnel("vendas")).toBe("contato_inicial");
    expect(getDefaultStageForFunnel("festa")).toBe("boas_vindas");
    expect(getDefaultStageForFunnel("executadas")).toBe("aguardando_feedback");
  });

  it("valida etapas somente dentro do funil correspondente", () => {
    expect(isStageValidForFunnel("vendas", "fechado")).toBe(true);
    expect(isStageValidForFunnel("festa", "contrato")).toBe(true);
    expect(isStageValidForFunnel("executadas", "redes_sociais")).toBe(true);

    expect(isStageValidForFunnel("vendas", "contrato")).toBe(false);
    expect(isStageValidForFunnel("festa", "oportunidade_futura")).toBe(false);
    expect(isStageValidForFunnel("executadas", "perdido")).toBe(false);
  });
});
