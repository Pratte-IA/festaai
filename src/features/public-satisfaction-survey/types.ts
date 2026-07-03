export type PublicSatisfactionQuestionType = "scale" | "single_choice" | "textarea";

export interface PublicSatisfactionQuestion {
  config: Record<string, unknown>;
  id: string;
  label: string;
  questionType: PublicSatisfactionQuestionType;
  required: boolean;
  sortOrder: number;
}

export interface ClientSatisfactionSurveyConfig {
  alreadySubmitted?: boolean;
  aniversarianteNome: string | null;
  clientName: string;
  companyName: string;
  message?: string;
  partyDate: string | null;
  questions: PublicSatisfactionQuestion[];
  savedResponses: Record<string, string>;
  submittedAt?: string | null;
  tenantName: string;
  tenantSlug: string;
  title: string;
}

export interface ClientSatisfactionSurveySubmitResult {
  advancedToRedesSociais: boolean;
  etapa: string;
  funil: string;
  message: string;
  submittedAt: string;
}

export const buildPublicSatisfactionSurveyUrl = (tenantSlug: string, eventoId: number) =>
  `${typeof window !== "undefined" ? window.location.origin : ""}/pesquisa/${tenantSlug}/${eventoId}`;
