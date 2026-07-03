import { extractFirstName, formatCompanyDisplayName } from "@/lib/company-display-name";

export const SATISFACTION_SURVEY_DISPATCH_MESSAGE_TEMPLATE = `Oi, {{primeiro_nome}}! Tudo bem? 🥰

Queremos agradecer de coração por terem escolhido a {{nome_empresa}} para viver esse dia tão especial com a gente. Foi uma alegria fazer parte da festa do(a) {{nome_aniversariante}}! ✨

A sua opinião é muito importante para nós, porque nos ajuda a melhorar cada detalhe e continuar entregando momentos inesquecíveis para as famílias.

Preparamos uma pesquisa bem rápida que leva só 2 minutos para responder.

Pode nos contar como foi sua experiência? 💛

{{link_pesquisa}}`;

export const SATISFACTION_SURVEY_DISPATCH_PREVIEW = {
  aniversarianteNome: "Helena",
  clienteNome: "Maria Silva",
  eventoId: 123,
} as const;

export interface BuildSatisfactionSurveyDispatchMessageInput {
  aniversarianteNome: string | null;
  clienteNome: string | null;
  companyLegalName: string;
  surveyUrl: string;
}

export const buildSatisfactionSurveyDispatchMessage = (
  input: BuildSatisfactionSurveyDispatchMessageInput,
): string => {
  const companyName = formatCompanyDisplayName(input.companyLegalName);
  const aniversariante = input.aniversarianteNome?.trim() || "aniversariante";

  return SATISFACTION_SURVEY_DISPATCH_MESSAGE_TEMPLATE.replaceAll(
    "{{primeiro_nome}}",
    extractFirstName(input.clienteNome),
  )
    .replaceAll("{{nome_empresa}}", companyName)
    .replaceAll("{{nome_aniversariante}}", aniversariante)
    .replaceAll("{{link_pesquisa}}", input.surveyUrl);
};
