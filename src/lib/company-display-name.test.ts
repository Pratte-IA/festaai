import { describe, expect, it } from "vitest";

import { resolveSatisfactionSurveyLabel } from "@/features/configuracoes/satisfaction-survey-types";
import { extractFirstName, formatCompanyDisplayName } from "@/lib/company-display-name";

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
