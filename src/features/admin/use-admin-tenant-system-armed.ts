import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase/client";

export const adminTenantsQueryKey = ["admin", "tenants"] as const;

export const setTenantSystemArmed = async (tenantId: number, armed: boolean) => {
  const { error } = await supabase.from("tenant_automation_settings").upsert(
    {
      tenant_id: tenantId,
      system_armed: armed,
    },
    { onConflict: "tenant_id" },
  );

  if (error) throw error;
};

export const useSetTenantSystemArmed = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tenantId, armed }: { tenantId: number; armed: boolean }) => {
      await setTenantSystemArmed(tenantId, armed);
      return { tenantId, armed };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminTenantsQueryKey });
    },
  });
};
