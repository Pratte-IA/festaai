import { extractFirstName, formatCompanyDisplayName } from "@/lib/company-display-name";

import { buildPublicSatisfactionSurveyUrl } from "./index";

export const SATISFACTION_SURVEY_FOLLOWUP_DELAY_HOURS = 24;

export const SATISFACTION_SURVEY_FOLLOWUP_MESSAGE_TEMPLATE_KEY =
  "pesquisa-satisfacao-followup";

export const DEFAULT_SATISFACTION_SURVEY_FOLLOWUP_MESSAGE = `Oi, {{primeiro_nome}}! Tudo bem? 💛

Passando com carinho para lembrar da nossa pesquisa sobre a festa do(a) {{nome_aniversariante}}.

Para nós foi um momento mágico receber vocês na {{nome_empresa}}, e a sua opinião ajuda muito a melhorarmos cada detalhe.

Se ainda não respondeu, é só clicar no link — leva menos de 2 minutos:

{{link_pesquisa}}`;

export const SATISFACTION_SURVEY_FOLLOWUP_PREVIEW = {
  aniversarianteNome: "Helena",
  clienteNome: "Maria Silva",
  eventoId: 123,
} as const;

export const buildSatisfactionSurveyFollowupPreviewMessage = (input: {
  aniversarianteNome: string;
  clienteNome: string;
  companyLegalName: string;
  surveyUrl: string;
  templateBody?: string;
}): string => {
  const template = input.templateBody?.trim() || DEFAULT_SATISFACTION_SURVEY_FOLLOWUP_MESSAGE;
  const companyName = formatCompanyDisplayName(input.companyLegalName);
  const aniversariante = input.aniversarianteNome.trim() || "aniversariante";

  return template
    .replaceAll("{{primeiro_nome}}", extractFirstName(input.clienteNome))
    .replaceAll("{{nome_empresa}}", companyName)
    .replaceAll("{{nome_aniversariante}}", aniversariante)
    .replaceAll("{{link_pesquisa}}", input.surveyUrl);
};

export const buildSatisfactionSurveyFollowupPreviewUrl = (
  tenantSlug: string,
  eventoId: number,
) => buildPublicSatisfactionSurveyUrl(tenantSlug, eventoId);
