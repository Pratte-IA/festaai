import { describe, expect, it } from "vitest";

import {
  getDefaultStageForFunnel,
  isStageValidForFunnel,
  resolveFunnelStageAfterClientForm,
  resolveFunnelStageForImport,
} from "./stage-validation";
import type { Stage } from "./types";

describe("stage-validation", () => {
  it("retorna a primeira etapa como padrao para cada funil", () => {
    expect(getDefaultStageForFunnel("vendas")).toBe("contato_inicial");
    expect(getDefaultStageForFunnel("festa")).toBe("boas_vindas");
    expect(getDefaultStageForFunnel("executadas")).toBe("aguardando_feedback");
  });

  it("valida etapas somente dentro do funil correspondente", () => {
    expect(isStageValidForFunnel("vendas", "negociacao")).toBe(true);
    expect(isStageValidForFunnel("vendas", "contrato")).toBe(false);
    expect(isStageValidForFunnel("festa", "contrato")).toBe(true);
    expect(isStageValidForFunnel("executadas", "redes_sociais")).toBe(true);

    expect(isStageValidForFunnel("vendas", "boas_vindas")).toBe(false);
    expect(isStageValidForFunnel("festa", "oportunidade_futura")).toBe(false);
    expect(isStageValidForFunnel("executadas", "perdido")).toBe(false);
  });

  it("migra etapas legadas de vendas para festa / boas_vindas", () => {
    expect(resolveFunnelStageForImport("vendas", "fechado" as Stage)).toEqual({
      funnel: "festa",
      stage: "boas_vindas",
    });
    expect(resolveFunnelStageForImport("vendas", "contrato" as Stage)).toEqual({
      funnel: "festa",
      stage: "boas_vindas",
    });
    expect(resolveFunnelStageForImport("festa", "contrato")).toEqual({
      funnel: "festa",
      stage: "contrato",
    });
  });

  it("migra lead de vendas para festa / boas_vindas apos formulario do cliente", () => {
    expect(resolveFunnelStageAfterClientForm("vendas")).toEqual({
      etapa: "boas_vindas",
      funil: "festa",
      status_interno: "ativo",
    });
    expect(resolveFunnelStageAfterClientForm("festa")).toBeNull();
  });
});
