import { useMutation } from "@tanstack/react-query";
import { FunctionsHttpError } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase/client";

import type {
  ClientSatisfactionSurveyConfig,
  ClientSatisfactionSurveySubmitResult,
} from "./types";

const resolveFunctionError = async (error: unknown) => {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = (await error.context.json()) as { error?: string };
      if (body.error) return body.error;
    } catch {
      // mantém mensagem padrão
    }
  }

  if (error instanceof Error && error.message) return error.message;
  return "Tente novamente em instantes.";
};

export interface LoadClientSatisfactionSurveyInput {
  clientPhone: string;
  eventoId: number;
  tenantSlug: string;
}

export interface SubmitClientSatisfactionSurveyInput extends LoadClientSatisfactionSurveyInput {
  responses: Record<string, string>;
}

export const loadClientSatisfactionSurvey = async (
  payload: LoadClientSatisfactionSurveyInput,
): Promise<ClientSatisfactionSurveyConfig> => {
  const { data, error } = await supabase.functions.invoke<ClientSatisfactionSurveyConfig>(
    "client-satisfaction-survey",
    {
      body: {
        action: "load",
        ...payload,
      },
    },
  );

  if (error) throw new Error(await resolveFunctionError(error));
  if (!data || typeof (data as { error?: string }).error === "string") {
    throw new Error(
      typeof (data as { error?: string } | null)?.error === "string"
        ? (data as { error: string }).error
        : "Pesquisa indisponível.",
    );
  }

  return data;
};

export const useSubmitClientSatisfactionSurvey = () =>
  useMutation({
    mutationFn: async (
      payload: SubmitClientSatisfactionSurveyInput,
    ): Promise<ClientSatisfactionSurveySubmitResult> => {
      const { data, error } = await supabase.functions.invoke<ClientSatisfactionSurveySubmitResult>(
        "client-satisfaction-survey",
        {
          body: {
            action: "submit",
            ...payload,
          },
        },
      );

      if (error) throw new Error(await resolveFunctionError(error));
      if (!data) throw new Error("Resposta vazia ao enviar a pesquisa.");
      if ("error" in data && typeof (data as { error?: string }).error === "string") {
        throw new Error((data as { error: string }).error);
      }

      return data;
    },
  });
