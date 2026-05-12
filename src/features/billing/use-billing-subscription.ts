import { useQuery } from "@tanstack/react-query";

import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

import { billingQueryKeys } from "./query-keys";

export const useBillingSubscription = () => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: !!currentTenantId,
    queryKey: billingQueryKeys.subscription(currentTenantId),
    queryFn: async () => {
      if (!currentTenantId) {
        return null;
      }

      const { data, error } = await supabase
        .from("billing_subscriptions")
        .select("*, subscription_plans(*)")
        .eq("tenant_id", currentTenantId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    },
  });
};
