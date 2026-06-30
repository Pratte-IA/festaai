import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FunctionsHttpError } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase/client";

import { billingQueryKeys } from "./query-keys";
import { ActivateSubscriptionCheckoutResponse } from "./types";

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

  return "Não foi possível iniciar o checkout da mensalidade.";
};

export const useActivateSubscriptionCheckout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (externalReference: string) => {
      const { data, error } = await supabase.functions.invoke<ActivateSubscriptionCheckoutResponse>(
        "activate-subscription-checkout",
        { body: { externalReference } },
      );

      if (error) {
        throw new Error(await resolveErrorMessage(error));
      }

      if (!data) {
        throw new Error("A função de mensalidade não retornou dados.");
      }

      return data;
    },
    onSuccess: (_data, externalReference) => {
      void queryClient.invalidateQueries({
        queryKey: billingQueryKeys.publicCheckout(externalReference),
      });
      void queryClient.invalidateQueries({
        queryKey: billingQueryKeys.paymentDetails(externalReference, "subscription"),
      });
    },
  });
};
