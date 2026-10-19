export const PESQUISA_SATISFACAO_INBOUND_TEMPLATE_KEY = "pesquisa-satisfacao";

export interface SatisfactionSurveyReplyForwardInput {
  fromMe: boolean;
  hasSurveySentToPhone: boolean;
  inboundAutomationEnabled: boolean;
  isAtendimentoConnection: boolean;
  isPesquisaConnection: boolean;
  systemArmed: boolean;
  webhookReady: boolean;
}

/**
 * Resposta no WhatsApp que enviou a pesquisa entra no agente.
 * Não vale para o número de Atendimento (esse fluxo já encaminha) nem para fromMe.
 */
export const shouldForwardSatisfactionSurveyReply = (
  input: SatisfactionSurveyReplyForwardInput,
): boolean => {
  if (input.isAtendimentoConnection || !input.isPesquisaConnection) return false;
  if (input.fromMe) return false;
  if (!input.systemArmed || !input.inboundAutomationEnabled || !input.webhookReady) return false;
  return input.hasSurveySentToPhone;
};
