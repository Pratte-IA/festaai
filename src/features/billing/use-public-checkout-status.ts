import { useQuery } from "@tanstack/react-query";
import { FunctionsHttpError } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase/client";

import { billingQueryKeys } from "./query-keys";
import { PublicCheckoutStatus } from "./types";

const resolveStatusErrorMessage = async (error: unknown) => {
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

  return "Não foi possível consultar o pagamento.";
};

export const usePublicCheckoutStatus = (externalReference?: string | null) =>
  useQuery({
    enabled: Boolean(externalReference),
    queryKey: billingQueryKeys.publicCheckout(externalReference),
    queryFn: async () => {
      if (!externalReference) {
        return null;
      }

      const { data, error } = await supabase.functions.invoke<PublicCheckoutStatus>(
        "get-public-checkout-status",
        {
          body: { externalReference },
        },
      );

      if (error) {
        throw new Error(await resolveStatusErrorMessage(error));
      }

      if (!data) {
        throw new Error("A função de status não retornou dados.");
      }

      return data;
    },
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "active" || status === "canceled" || status === "failed") {
        return false;
      }
      return 5000;
    },
  });
