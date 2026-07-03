export const SATISFACTION_SURVEY_COMPANY_PLACEHOLDER = "{{nome_empresa}}";

export type SatisfactionSurveyQuestionType = "scale" | "single_choice" | "textarea";

export interface SatisfactionSurveyScaleConfig {
  max: number;
  min: number;
}

export interface SatisfactionSurveyChoiceConfig {
  options: string[];
}

export type SatisfactionSurveyQuestionConfig =
  | SatisfactionSurveyScaleConfig
  | SatisfactionSurveyChoiceConfig
  | Record<string, never>;

export interface SatisfactionSurveyQuestion {
  active: boolean;
  config: SatisfactionSurveyQuestionConfig;
  id: string;
  isSystem: boolean;
  label: string;
  questionKey: string | null;
  questionType: SatisfactionSurveyQuestionType;
  required: boolean;
  sortOrder: number;
}

export interface SatisfactionSurveyQuestionUpdatePayload {
  active?: boolean;
  config?: SatisfactionSurveyQuestionConfig;
  label?: string;
  questionId: string;
  questionType?: SatisfactionSurveyQuestionType;
  required?: boolean;
}

export const satisfactionSurveyQuestionTypeLabels: Record<SatisfactionSurveyQuestionType, string> = {
  scale: "Nota de 0 a 10",
  single_choice: "Escolha única",
  textarea: "Resposta aberta",
};

export const CUSTOM_SATISFACTION_QUESTION_TYPES: SatisfactionSurveyQuestionType[] = [
  "single_choice",
  "textarea",
];

export const isSatisfactionSurveyChoiceType = (
  questionType: SatisfactionSurveyQuestionType,
): questionType is "single_choice" => questionType === "single_choice";

export const parseSurveyOptionsFromLines = (text: string): string[] =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

export const formatSurveyOptionsAsLines = (options: string[]): string => options.join("\n");

export const parseSurveyQuestionConfig = (
  questionType: SatisfactionSurveyQuestionType,
  config: Record<string, unknown> | null | undefined,
): SatisfactionSurveyQuestionConfig => {
  if (questionType === "scale") {
    const min = typeof config?.min === "number" ? config.min : 0;
    const max = typeof config?.max === "number" ? config.max : 10;
    return { min, max };
  }

  if (questionType === "single_choice") {
    const options = Array.isArray(config?.options)
      ? config.options.filter((option): option is string => typeof option === "string" && option.trim().length > 0)
      : [];
    return { options };
  }

  return {};
};
