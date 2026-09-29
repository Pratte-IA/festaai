import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase/client";

export const adminTenantsQueryKey = ["admin", "tenants"] as const;

export const setTenantSystemArmed = async (tenantId: number, armed: boolean) => {
  const { data: units, error: unitsError } = await supabase
    .from("tenant_units")
    .select("id")
    .eq("tenant_id", tenantId);

  if (unitsError) throw unitsError;
  if (!units || units.length === 0) {
    throw new Error("Este cliente ainda não tem matriz.");
  }

  const { error } = await supabase.from("tenant_automation_settings").upsert(
    units.map((unit) => ({
      system_armed: armed,
      tenant_id: tenantId,
      unit_id: unit.id,
    })),
    { onConflict: "unit_id" },
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
