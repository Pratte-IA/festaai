import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FunctionsHttpError } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase/client";

import { billingQueryKeys } from "./query-keys";
import { PayWithCreditCardRequest, PayWithCreditCardResponse } from "./types";

const resolveErrorMessage = async (error: unknown) => {
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

  return "Não foi possível processar o pagamento com cartão.";
};

export const usePayWithCreditCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: PayWithCreditCardRequest) => {
      const { data, error } = await supabase.functions.invoke<PayWithCreditCardResponse>(
        "pay-with-credit-card",
        { body: payload },
      );

      if (error) {
        throw new Error(await resolveErrorMessage(error));
      }

      if (!data) {
        throw new Error("A função de cartão não retornou dados.");
      }

      return data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: billingQueryKeys.publicCheckout(variables.externalReference),
      });
      void queryClient.invalidateQueries({
        queryKey: billingQueryKeys.paymentDetails(variables.externalReference, variables.paymentKind),
      });
    },
  });
};
