export interface TenantSatisfactionSurveySubmissionListItem {
  aniversarianteNome: string | null;
  avaliacaoNota: string | null;
  clienteNome: string;
  dataEvento: string | null;
  eventoId: number;
  pacoteNome: string | null;
  respondedAt: string | null;
  sentAt: string | null;
}

export type SatisfactionSurveySubmissionStatus = "pending" | "responded";

export const getSatisfactionSurveySubmissionStatus = (
  item: TenantSatisfactionSurveySubmissionListItem,
): SatisfactionSurveySubmissionStatus =>
  item.respondedAt ? "responded" : "pending";

export const satisfactionSurveySubmissionStatusLabels: Record<
  SatisfactionSurveySubmissionStatus,
  string
> = {
  pending: "Aguardando resposta",
  responded: "Respondida",
};
