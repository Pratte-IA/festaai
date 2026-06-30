import { useQuery } from "@tanstack/react-query";
import { FunctionsHttpError } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase/client";

import { billingQueryKeys } from "./query-keys";
import { PaymentCheckoutDetails, PaymentKind } from "./types";

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

  return "Não foi possível carregar os dados de pagamento.";
};

export const usePaymentCheckoutDetails = (
  externalReference?: string | null,
  paymentKind?: PaymentKind | null,
  enabled = true,
) =>
  useQuery({
    enabled: Boolean(externalReference && paymentKind && enabled),
    queryKey: billingQueryKeys.paymentDetails(externalReference, paymentKind),
    queryFn: async () => {
      if (!externalReference || !paymentKind) {
        return null;
      }

      const { data, error } = await supabase.functions.invoke<PaymentCheckoutDetails>(
        "get-payment-checkout-details",
        {
          body: { externalReference, paymentKind },
        },
      );

      if (error) {
        throw new Error(await resolveErrorMessage(error));
      }

      if (!data) {
        throw new Error("A função de pagamento não retornou dados.");
      }

      return data;
    },
    refetchInterval: (query) => {
      const paymentStatus = query.state.data?.paymentStatus;
      if (paymentStatus === "RECEIVED" || paymentStatus === "CONFIRMED") {
        return false;
      }
      return 8000;
    },
  });
