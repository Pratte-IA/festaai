import { useQuery } from "@tanstack/react-query";

import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

import { configuracoesQueryKeys } from "./query-keys";
import {
  formatSatisfactionSurveyResponseValue,
  parseSurveyQuestionConfig,
  type SatisfactionSurveyQuestionType,
} from "./satisfaction-survey-types";
import type { TenantSatisfactionSurveySubmissionListItem } from "./satisfaction-survey-submission-types";

const fetchTenantSatisfactionSurveySubmissions = async (
  tenantId: number,
): Promise<TenantSatisfactionSurveySubmissionListItem[]> => {
  const [eventosResult, firstQuestionResult] = await Promise.all([
    supabase
      .from("eventos")
      .select(
        "id, cliente_nome, aniversariante_nome, data_evento, pacote_nome, satisfaction_survey_whatsapp_enviado_em, satisfaction_survey_preenchido_em",
      )
      .eq("tenant_id", tenantId)
      .or(
        "satisfaction_survey_whatsapp_enviado_em.not.is.null,satisfaction_survey_preenchido_em.not.is.null",
      )
      .order("satisfaction_survey_preenchido_em", { ascending: false, nullsFirst: false })
      .order("satisfaction_survey_whatsapp_enviado_em", { ascending: false, nullsFirst: false }),
    supabase
      .from("tenant_satisfaction_survey_questions")
      .select("id, question_type, config")
      .eq("tenant_id", tenantId)
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  if (eventosResult.error) throw eventosResult.error;
  if (firstQuestionResult.error) throw firstQuestionResult.error;

  const eventoIds = (eventosResult.data ?? []).map((row) => row.id);
  const firstQuestion = firstQuestionResult.data;

  const scoresByEvento = new Map<number, string>();

  if (firstQuestion && eventoIds.length > 0) {
    const questionType = firstQuestion.question_type as SatisfactionSurveyQuestionType;
    const questionConfig = parseSurveyQuestionConfig(questionType, firstQuestion.config);

    const { data: responses, error: responsesError } = await supabase
      .from("evento_satisfaction_responses")
      .select("evento_id, value")
      .eq("tenant_id", tenantId)
      .eq("question_id", firstQuestion.id)
      .in("evento_id", eventoIds);

    if (responsesError) throw responsesError;

    (responses ?? []).forEach((row) => {
      const formatted = formatSatisfactionSurveyResponseValue(
        questionType,
        row.value ?? "",
        questionConfig,
      );

      if (formatted !== "—") {
        scoresByEvento.set(row.evento_id, formatted);
      }
    });
  }

  return (eventosResult.data ?? []).map((row) => ({
    aniversarianteNome: row.aniversariante_nome,
    avaliacaoNota: scoresByEvento.get(row.id) ?? null,
    clienteNome: row.cliente_nome,
    dataEvento: row.data_evento,
    eventoId: row.id,
    pacoteNome: row.pacote_nome,
    respondedAt: row.satisfaction_survey_preenchido_em,
    sentAt: row.satisfaction_survey_whatsapp_enviado_em,
  }));
};

export const useTenantSatisfactionSurveySubmissions = () => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(currentTenantId),
    queryFn: () => fetchTenantSatisfactionSurveySubmissions(currentTenantId as number),
    queryKey: configuracoesQueryKeys.satisfactionSurveySubmissionsList(currentTenantId),
  });
};
