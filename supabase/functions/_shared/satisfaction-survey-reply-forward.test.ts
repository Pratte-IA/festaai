import { describe, expect, it } from "vitest";

import { shouldForwardSatisfactionSurveyReply } from "./satisfaction-survey-reply-forward.ts";

const ready = {
  fromMe: false,
  hasSurveySentToPhone: true,
  inboundAutomationEnabled: true,
  isAtendimentoConnection: false,
  isPesquisaConnection: true,
  systemArmed: true,
  webhookReady: true,
};

describe("shouldForwardSatisfactionSurveyReply", () => {
  it("encaminha a resposta de quem já recebeu a pesquisa no WhatsApp da pesquisa", () => {
    expect(shouldForwardSatisfactionSurveyReply(ready)).toBe(true);
  });

  it("não encaminha conversa que já entra pelo Atendimento", () => {
    expect(
      shouldForwardSatisfactionSurveyReply({ ...ready, isAtendimentoConnection: true }),
    ).toBe(false);
  });

  it("não encaminha número que não enviou a pesquisa", () => {
    expect(
      shouldForwardSatisfactionSurveyReply({ ...ready, isPesquisaConnection: false }),
    ).toBe(false);
    expect(
      shouldForwardSatisfactionSurveyReply({ ...ready, hasSurveySentToPhone: false }),
    ).toBe(false);
  });

  it("ignora eco da própria mensagem enviada", () => {
    expect(shouldForwardSatisfactionSurveyReply({ ...ready, fromMe: true })).toBe(false);
  });

  it("exige sistema ativo e webhook de atendimento pronto", () => {
    expect(shouldForwardSatisfactionSurveyReply({ ...ready, systemArmed: false })).toBe(false);
    expect(
      shouldForwardSatisfactionSurveyReply({ ...ready, inboundAutomationEnabled: false }),
    ).toBe(false);
    expect(shouldForwardSatisfactionSurveyReply({ ...ready, webhookReady: false })).toBe(false);
  });
});
