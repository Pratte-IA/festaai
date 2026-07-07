import { useQuery } from "@tanstack/react-query";

import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

import { configuracoesQueryKeys } from "./query-keys";

export const useEventoSatisfactionResponses = (eventoId: number | null) => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(currentTenantId && eventoId),
    queryFn: async (): Promise<Record<string, string>> => {
      const { data, error } = await supabase
        .from("evento_satisfaction_responses")
        .select("question_id, value")
        .eq("tenant_id", currentTenantId as number)
        .eq("evento_id", eventoId as number);

      if (error) throw error;

      const responses: Record<string, string> = {};
      (data ?? []).forEach((row) => {
        responses[String(row.question_id)] = row.value ?? "";
      });

      return responses;
    },
    queryKey: configuracoesQueryKeys.satisfactionSurveyResponses(currentTenantId, eventoId),
  });
};
