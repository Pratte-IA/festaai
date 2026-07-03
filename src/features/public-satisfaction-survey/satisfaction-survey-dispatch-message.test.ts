import { describe, expect, it } from "vitest";

import {
  buildSatisfactionSurveyDispatchMessage,
  SATISFACTION_SURVEY_DISPATCH_MESSAGE_TEMPLATE,
} from "./dispatch-message";

describe("satisfaction-survey-dispatch-message", () => {
  it("monta o texto padrão com dados do tenant e do evento", () => {
    const message = buildSatisfactionSurveyDispatchMessage({
      aniversarianteNome: "Helena",
      clienteNome: "Juliana Costa",
      companyLegalName: "Vila Encantada Festas LTDA",
      surveyUrl: "https://festaai.com.br/pesquisa/vila-encantada/42",
    });

    expect(message).toContain("Oi, Juliana! Tudo bem?");
    expect(message).toContain("Vila Encantada Festas");
    expect(message).not.toContain("LTDA");
    expect(message).toContain("festa do(a) Helena");
    expect(message).toContain("https://festaai.com.br/pesquisa/vila-encantada/42");
    expect(message).toBe(
      SATISFACTION_SURVEY_DISPATCH_MESSAGE_TEMPLATE.replaceAll("{{primeiro_nome}}", "Juliana")
        .replaceAll("{{nome_empresa}}", "Vila Encantada Festas")
        .replaceAll("{{nome_aniversariante}}", "Helena")
        .replaceAll("{{link_pesquisa}}", "https://festaai.com.br/pesquisa/vila-encantada/42"),
    );
  });
});
