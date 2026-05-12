import { useQuery } from "@tanstack/react-query";

import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

import { emailQueryKeys } from "./query-keys";

export const useEmailEvents = () => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: !!currentTenantId,
    queryKey: emailQueryKeys.events(currentTenantId),
    queryFn: async () => {
      if (!currentTenantId) {
        return [];
      }

      const { data, error } = await supabase
        .from("email_events")
        .select("*")
        .eq("tenant_id", currentTenantId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        throw error;
      }

      return data;
    },
  });
};
