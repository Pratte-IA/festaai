import { describe, expect, it } from "vitest";

import { resolveSatisfactionSurveyLabel } from "@/features/configuracoes/satisfaction-survey-types";
import { extractDisplayFirstName, extractFirstName, formatCompanyDisplayName } from "@/lib/company-display-name";

describe("company-display-name", () => {
  it("remove sufixos jurídicos comuns", () => {
    expect(formatCompanyDisplayName("Vila Encantada Festas LTDA")).toBe("Vila Encantada Festas");
    expect(formatCompanyDisplayName("Espaço Alegria ME")).toBe("Espaço Alegria");
    expect(formatCompanyDisplayName("Buffet Sonho S/A")).toBe("Buffet Sonho");
    expect(formatCompanyDisplayName("Casa Festa Ltda.")).toBe("Casa Festa");
  });

  it("extrai o primeiro nome do contratante", () => {
    expect(extractFirstName("Maria Fernanda Silva")).toBe("Maria");
    expect(extractFirstName("")).toBe("Cliente");
  });

  it("extrai nome composto para exibicao", () => {
    expect(extractDisplayFirstName("Maria Clara prim do nascimento")).toBe("Maria Clara");
    expect(extractDisplayFirstName("Judi cristina prim do nascimento")).toBe("Judi");
    expect(extractDisplayFirstName("João Pedro Silva")).toBe("João Pedro");
  });
});

describe("resolveSatisfactionSurveyLabel", () => {
  it("substitui nome_empresa sem sufixos jurídicos", () => {
    expect(
      resolveSatisfactionSurveyLabel(
        "Você contrataria a {{nome_empresa}} novamente?",
        "Vila Encantada Festas LTDA",
      ),
    ).toBe("Você contrataria a Vila Encantada Festas novamente?");
  });
});
