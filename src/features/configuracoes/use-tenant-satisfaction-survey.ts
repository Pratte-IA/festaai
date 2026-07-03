import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";
import { Json } from "@/lib/supabase/database.types";

import { configuracoesQueryKeys } from "./query-keys";
import {
  parseSurveyQuestionConfig,
  type SatisfactionSurveyQuestion,
  type SatisfactionSurveyQuestionConfig,
  type SatisfactionSurveyQuestionType,
  type SatisfactionSurveyQuestionUpdatePayload,
} from "./satisfaction-survey-types";

const mapQuestionRow = (row: {
  active: boolean;
  config?: Record<string, unknown> | null;
  id: number;
  is_system: boolean;
  label: string;
  question_key: string | null;
  question_type: string;
  required: boolean;
  sort_order: number;
}): SatisfactionSurveyQuestion => {
  const questionType = row.question_type as SatisfactionSurveyQuestionType;

  return {
    active: row.active,
    config: parseSurveyQuestionConfig(questionType, row.config),
    id: String(row.id),
    isSystem: row.is_system,
    label: row.label,
    questionKey: row.question_key,
    questionType,
    required: row.required,
    sortOrder: row.sort_order,
  };
};

export const useTenantSatisfactionSurvey = () => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(currentTenantId),
    queryFn: async (): Promise<SatisfactionSurveyQuestion[]> => {
      const { data, error } = await supabase
        .from("tenant_satisfaction_survey_questions")
        .select("*")
        .eq("tenant_id", currentTenantId as number)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;

      return (data ?? []).map(mapQuestionRow);
    },
    queryKey: configuracoesQueryKeys.satisfactionSurvey(currentTenantId),
  });
};

export const useCreateSatisfactionSurveyQuestion = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      config,
      label,
      questionType,
      required = false,
    }: {
      config?: SatisfactionSurveyQuestionConfig;
      label: string;
      questionType: SatisfactionSurveyQuestionType;
      required?: boolean;
    }) => {
      if (!currentTenantId || !user) throw new Error("Sessão ou tenant atual indisponível.");

      const { data: lastQuestion, error: sortError } = await supabase
        .from("tenant_satisfaction_survey_questions")
        .select("sort_order")
        .eq("tenant_id", currentTenantId)
        .order("sort_order", { ascending: false })
        .limit(1);

      if (sortError) throw sortError;

      const nextSortOrder = (lastQuestion?.[0]?.sort_order ?? 0) + 1;
      const customKey = `custom_${crypto.randomUUID()}`;

      const { data, error } = await supabase
        .from("tenant_satisfaction_survey_questions")
        .insert({
          config: (config ?? {}) as Json,
          created_by: user.id,
          is_system: false,
          label: label.trim(),
          question_key: customKey,
          question_type: questionType,
          required,
          sort_order: nextSortOrder,
          tenant_id: currentTenantId,
          updated_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      return mapQuestionRow(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: configuracoesQueryKeys.satisfactionSurvey(currentTenantId),
      });
    },
  });
};

export const useUpdateSatisfactionSurveyQuestion = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      active,
      config,
      label,
      questionId,
      questionType,
      required,
    }: SatisfactionSurveyQuestionUpdatePayload) => {
      if (!currentTenantId || !user) throw new Error("Sessão ou tenant atual indisponível.");

      const payload: Record<string, unknown> = { updated_by: user.id };
      if (active !== undefined) payload.active = active;
      if (required !== undefined) payload.required = required;
      if (label !== undefined) payload.label = label.trim();
      if (questionType !== undefined) payload.question_type = questionType;
      if (config !== undefined) payload.config = config as Json;

      const { error } = await supabase
        .from("tenant_satisfaction_survey_questions")
        .update(payload)
        .eq("tenant_id", currentTenantId)
        .eq("id", Number(questionId));

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: configuracoesQueryKeys.satisfactionSurvey(currentTenantId),
      });
    },
  });
};

export const useReorderSatisfactionSurveyQuestion = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      direction,
      questionId,
    }: {
      direction: "down" | "up";
      questionId: string;
    }) => {
      if (!currentTenantId || !user) throw new Error("Sessão ou tenant atual indisponível.");

      const { data: questions, error: listError } = await supabase
        .from("tenant_satisfaction_survey_questions")
        .select("id, sort_order")
        .eq("tenant_id", currentTenantId)
        .order("sort_order", { ascending: true })
        .order("id", { ascending: true });

      if (listError) throw listError;

      const rows = questions ?? [];
      const currentIndex = rows.findIndex((row) => String(row.id) === questionId);
      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

      if (currentIndex < 0 || targetIndex < 0 || targetIndex >= rows.length) return;

      const current = rows[currentIndex];
      const neighbor = rows[targetIndex];

      const { error: firstError } = await supabase
        .from("tenant_satisfaction_survey_questions")
        .update({ sort_order: neighbor.sort_order, updated_by: user.id })
        .eq("tenant_id", currentTenantId)
        .eq("id", current.id);

      if (firstError) throw firstError;

      const { error: secondError } = await supabase
        .from("tenant_satisfaction_survey_questions")
        .update({ sort_order: current.sort_order, updated_by: user.id })
        .eq("tenant_id", currentTenantId)
        .eq("id", neighbor.id);

      if (secondError) throw secondError;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: configuracoesQueryKeys.satisfactionSurvey(currentTenantId),
      });
    },
  });
};

export const useDeleteSatisfactionSurveyQuestion = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();

  return useMutation({
    mutationFn: async (questionId: string) => {
      if (!currentTenantId) throw new Error("Tenant atual indisponível.");

      const { error } = await supabase
        .from("tenant_satisfaction_survey_questions")
        .delete()
        .eq("tenant_id", currentTenantId)
        .eq("id", Number(questionId));

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: configuracoesQueryKeys.satisfactionSurvey(currentTenantId),
      });
    },
  });
};
