import { describe, expect, it } from "vitest";

import {
  buildSatisfactionSurveyNpsBaixaPreviewMessage,
  DEFAULT_SATISFACTION_SURVEY_NPS_BAIXA_MESSAGE,
} from "./satisfaction-survey-nps-baixa";

describe("satisfaction-survey-nps-baixa", () => {
  it("monta o texto padrão com primeiro nome e aniversariante", () => {
    const message = buildSatisfactionSurveyNpsBaixaPreviewMessage({
      aniversarianteNome: "Helena",
      clienteNome: "Maria Silva",
    });

    expect(message).toContain("Oi, Maria!");
    expect(message).toContain("festa do(a) Helena");
    expect(message).toBe(
      DEFAULT_SATISFACTION_SURVEY_NPS_BAIXA_MESSAGE.replaceAll("{{primeiro_nome}}", "Maria").replaceAll(
        "{{nome_aniversariante}}",
        "Helena",
      ),
    );
  });

  it("usa o template customizado quando informado", () => {
    const message = buildSatisfactionSurveyNpsBaixaPreviewMessage({
      aniversarianteNome: "Leo",
      clienteNome: "Ana",
      templateBody: "Olá {{primeiro_nome}}, sobre a festa do(a) {{nome_aniversariante}}.",
    });

    expect(message).toBe("Olá Ana, sobre a festa do(a) Leo.");
  });
});
