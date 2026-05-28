import { useMutation } from "@tanstack/react-query";
import { FunctionsHttpError } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase/client";

import { CheckoutRequest, CheckoutResponse } from "./types";

const resolveCheckoutErrorMessage = async (error: unknown) => {
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

  return "Tente novamente em instantes.";
};

export const useCreateCheckout = () =>
  useMutation({
    mutationFn: async (payload: CheckoutRequest) => {
      const { data, error } = await supabase.functions.invoke<CheckoutResponse>("create-asaas-checkout", {
        body: payload,
      });

      if (error) {
        throw new Error(await resolveCheckoutErrorMessage(error));
      }

      if (!data) {
        throw new Error("A função de checkout não retornou dados.");
      }

      return data;
    },
  });
