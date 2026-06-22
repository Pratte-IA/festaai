import { useMutation } from "@tanstack/react-query";
import { FunctionsHttpError } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase/client";

import { SubmitCommercialLeadRequest } from "./types";

const resolveErrorMessage = async (error: unknown) => {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = (await error.context.json()) as { error?: string };
      if (body.error) return body.error;
    } catch {
      // fallback abaixo
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Não foi possível enviar sua solicitação. Tente novamente.";
};

export const useSubmitCommercialLead = () =>
  useMutation({
    mutationFn: async (payload: SubmitCommercialLeadRequest) => {
      const { data, error } = await supabase.functions.invoke<{ leadId: number; status: string }>(
        "submit-commercial-lead",
        { body: payload },
      );

      if (error) {
        throw new Error(await resolveErrorMessage(error));
      }

      if (!data?.leadId) {
        throw new Error("Resposta inválida ao enviar solicitação.");
      }

      return data;
    },
  });
