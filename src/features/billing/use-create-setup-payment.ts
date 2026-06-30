import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FunctionsHttpError } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase/client";

import { billingQueryKeys } from "./query-keys";
import { CreateSetupPaymentRequest, CreateSetupPaymentResponse } from "./types";

const resolveSetupPaymentErrorMessage = async (error: unknown) => {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = (await error.context.json()) as { error?: string };
      if (body.error) return body.error;
    } catch {
      // Mantém a mensagem padrão quando o corpo da resposta não for JSON.
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Não foi possível gerar a cobrança.";
};

export const useCreateSetupPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateSetupPaymentRequest) => {
      const { data, error } = await supabase.functions.invoke<CreateSetupPaymentResponse>(
        "create-setup-payment",
        { body: payload },
      );

      if (error) {
        throw new Error(await resolveSetupPaymentErrorMessage(error));
      }

      if (!data) {
        throw new Error("A função de cobrança não retornou dados.");
      }

      return data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: billingQueryKeys.publicCheckout(variables.externalReference),
      });
    },
  });
};
