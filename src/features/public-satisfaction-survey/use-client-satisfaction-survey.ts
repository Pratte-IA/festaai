import { useMutation } from "@tanstack/react-query";

import { invokePublicFunction } from "@/lib/supabase/invoke-public-function";

import type {
  ClientSatisfactionSurveyConfig,
  ClientSatisfactionSurveySubmitResult,
} from "./types";

export interface LoadClientSatisfactionSurveyInput {
  clientPhone: string;
  eventoId: number;
  tenantSlug: string;
  unitSlug?: string;
}

export interface SubmitClientSatisfactionSurveyInput extends LoadClientSatisfactionSurveyInput {
  responses: Record<string, string>;
}

export const loadClientSatisfactionSurvey = async (
  payload: LoadClientSatisfactionSurveyInput,
): Promise<ClientSatisfactionSurveyConfig> => {
  return invokePublicFunction<ClientSatisfactionSurveyConfig>("client-satisfaction-survey", {
    action: "load",
    ...payload,
  });
};

export const useSubmitClientSatisfactionSurvey = () =>
  useMutation({
    mutationFn: async (
      payload: SubmitClientSatisfactionSurveyInput,
    ): Promise<ClientSatisfactionSurveySubmitResult> => {
      return invokePublicFunction<ClientSatisfactionSurveySubmitResult>("client-satisfaction-survey", {
        action: "submit",
        ...payload,
      });
    },
  });
