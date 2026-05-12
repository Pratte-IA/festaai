import { useMutation } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase/client";

import { CheckoutRequest, CheckoutResponse } from "./types";

export const useCreateCheckout = () =>
  useMutation({
    mutationFn: async (payload: CheckoutRequest) => {
      const { data, error } = await supabase.functions.invoke<CheckoutResponse>("create-asaas-checkout", {
        body: payload,
      });

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error("A função de checkout não retornou dados.");
      }

      return data;
    },
  });
