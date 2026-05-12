import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase/client";

import { billingQueryKeys } from "./query-keys";

export const useSubscriptionPlans = () =>
  useQuery({
    queryKey: billingQueryKeys.plans(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("active", true)
        .order("monthly_price", { ascending: true });

      if (error) {
        throw error;
      }

      return data;
    },
  });
