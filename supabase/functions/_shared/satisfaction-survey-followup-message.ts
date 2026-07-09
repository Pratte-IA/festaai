import { extractFirstName, formatCompanyDisplayName } from "./company-display-name.ts";
import { SATISFACTION_SURVEY_FOLLOWUP_MESSAGE_TEMPLATE_KEY } from "./satisfaction-survey-followup-constants.ts";
import { buildPublicSatisfactionSurveyUrl } from "./satisfaction-survey-dispatch-message.ts";

export const DEFAULT_SATISFACTION_SURVEY_FOLLOWUP_MESSAGE = `Oi, {{primeiro_nome}}! Tudo bem? 💛

Passando com carinho para lembrar da nossa pesquisa sobre a festa do(a) {{nome_aniversariante}}.

Para nós foi um momento mágico receber vocês na {{nome_empresa}}, e a sua opinião ajuda muito a melhorarmos cada detalhe.

Se ainda não respondeu, é só clicar no link — leva menos de 2 minutos:

{{link_pesquisa}}`;

export interface BuildSatisfactionSurveyFollowupMessageInput {
  aniversarianteNome: string | null;
  clienteNome: string | null;
  companyLegalName: string;
  surveyUrl: string;
  templateBody?: string | null;
}

export const buildSatisfactionSurveyFollowupMessage = (
  input: BuildSatisfactionSurveyFollowupMessageInput,
): string => {
  const template = input.templateBody?.trim() || DEFAULT_SATISFACTION_SURVEY_FOLLOWUP_MESSAGE;
  const companyName = formatCompanyDisplayName(input.companyLegalName);
  const aniversariante = input.aniversarianteNome?.trim() || "aniversariante";

  return template
    .replaceAll("{{primeiro_nome}}", extractFirstName(input.clienteNome))
    .replaceAll("{{nome_empresa}}", companyName)
    .replaceAll("{{nome_aniversariante}}", aniversariante)
    .replaceAll("{{link_pesquisa}}", input.surveyUrl);
};

export const buildSatisfactionSurveyFollowupNota = (input: { enviadoEm: string }): string => {
  const enviado = new Date(input.enviadoEm);
  const enviadoBR = enviado.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return `[Automação] Lembrete da pesquisa de satisfação enviado — ${enviadoBR}\nCliente ainda não respondeu 24h após o envio inicial. Lead movido para Redes Sociais.`;
};

export { SATISFACTION_SURVEY_FOLLOWUP_MESSAGE_TEMPLATE_KEY };
