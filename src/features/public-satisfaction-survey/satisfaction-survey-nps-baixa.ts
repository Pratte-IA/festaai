import { extractFirstName } from "@/lib/company-display-name";

export const SATISFACTION_SURVEY_NPS_BAIXA_MAX_SCORE = 7;

export const SATISFACTION_SURVEY_NPS_BAIXA_MESSAGE_TEMPLATE_KEY =
  "pesquisa-satisfacao-nps-baixa";

export const DEFAULT_SATISFACTION_SURVEY_NPS_BAIXA_MESSAGE = `Oi, {{primeiro_nome}}! Obrigada por responder à nossa pesquisa. 💛

Vimos que sua avaliação sobre a festa do(a) {{nome_aniversariante}} ficou abaixo do que gostaríamos de proporcionar, e sentimos muito por isso.

Sua experiência é muito importante para nós, e queremos entender com cuidado o que aconteceu e em quais pontos deixamos a desejar.

Você poderia nos contar um pouco mais sobre o que não saiu como esperava?

Queremos ouvir você, aprender com a situação e verificar o que podemos fazer para reparar essa experiência.`;

export const SATISFACTION_SURVEY_NPS_BAIXA_PREVIEW = {
  aniversarianteNome: "Helena",
  clienteNome: "Maria Silva",
} as const;

export const buildSatisfactionSurveyNpsBaixaPreviewMessage = (input: {
  aniversarianteNome: string;
  clienteNome: string;
  templateBody?: string;
}): string => {
  const template = input.templateBody?.trim() || DEFAULT_SATISFACTION_SURVEY_NPS_BAIXA_MESSAGE;
  const aniversariante = input.aniversarianteNome.trim() || "aniversariante";

  return template
    .replaceAll("{{primeiro_nome}}", extractFirstName(input.clienteNome))
    .replaceAll("{{nome_aniversariante}}", aniversariante);
};
