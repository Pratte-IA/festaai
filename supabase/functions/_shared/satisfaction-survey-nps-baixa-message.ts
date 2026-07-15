import { extractFirstName } from "./company-display-name.ts";
import {
  SATISFACTION_SURVEY_NPS_BAIXA_MAX_SCORE,
  SATISFACTION_SURVEY_NPS_BAIXA_MESSAGE_TEMPLATE_KEY,
  SATISFACTION_SURVEY_NPS_QUESTION_KEY,
} from "./satisfaction-survey-nps-baixa-constants.ts";

export const DEFAULT_SATISFACTION_SURVEY_NPS_BAIXA_MESSAGE = `Oi, {{primeiro_nome}}! Obrigada por responder à nossa pesquisa. 💛

Vimos que sua avaliação sobre a festa do(a) {{nome_aniversariante}} ficou abaixo do que gostaríamos de proporcionar, e sentimos muito por isso.

Sua experiência é muito importante para nós, e queremos entender com cuidado o que aconteceu e em quais pontos deixamos a desejar.

Você poderia nos contar um pouco mais sobre o que não saiu como esperava?

Queremos ouvir você, aprender com a situação e verificar o que podemos fazer para reparar essa experiência.`;

export interface BuildSatisfactionSurveyNpsBaixaMessageInput {
  aniversarianteNome: string | null;
  clienteNome: string | null;
  templateBody?: string | null;
}

export const buildSatisfactionSurveyNpsBaixaMessage = (
  input: BuildSatisfactionSurveyNpsBaixaMessageInput,
): string => {
  const template = input.templateBody?.trim() || DEFAULT_SATISFACTION_SURVEY_NPS_BAIXA_MESSAGE;
  const aniversariante = input.aniversarianteNome?.trim() || "aniversariante";

  return template
    .replaceAll("{{primeiro_nome}}", extractFirstName(input.clienteNome))
    .replaceAll("{{nome_aniversariante}}", aniversariante);
};

export const buildSatisfactionSurveyNpsBaixaNota = (input: {
  enviadoEm: string;
  npsScore: number;
}): string => {
  const enviado = new Date(input.enviadoEm);
  const enviadoBR = enviado.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return `[Automação] Follow-up NPS baixa (nota ${input.npsScore}/10) enviado — ${enviadoBR}\nCliente avaliou ≤ ${SATISFACTION_SURVEY_NPS_BAIXA_MAX_SCORE}; mensagem pedindo detalhes da experiência.`;
};

export const extractSatisfactionSurveyNpsScore = (
  questions: Array<{
    id: number;
    question_key: string | null;
    question_type: string;
  }>,
  responses: Record<string, string>,
): number | null => {
  const npsQuestion =
    questions.find((question) => question.question_key === SATISFACTION_SURVEY_NPS_QUESTION_KEY) ??
    questions.find((question) => question.question_type === "scale");

  if (!npsQuestion) return null;

  const raw = (responses[String(npsQuestion.id)] ?? "").trim();
  if (!raw) return null;

  const score = Number(raw);
  if (!Number.isFinite(score)) return null;

  return score;
};

export const shouldDispatchSatisfactionSurveyNpsBaixa = (npsScore: number | null): boolean =>
  npsScore != null && npsScore >= 0 && npsScore <= SATISFACTION_SURVEY_NPS_BAIXA_MAX_SCORE;

export { SATISFACTION_SURVEY_NPS_BAIXA_MESSAGE_TEMPLATE_KEY };
