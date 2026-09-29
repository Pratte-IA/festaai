import { useQuery } from "@tanstack/react-query";

import { deriveGuidedSetupState } from "@/features/guided-setup/derive-guided-setup-state";
import {
  isGuidedSetupComplete,
  isGuidedSetupStepKey,
  type GuidedSetupStepKey,
} from "@/features/guided-setup/guided-setup-steps";
import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

export const adminTenantGuidedSetupQueryKey = (tenantId: number) =>
  ["admin", "tenant-guided-setup", tenantId] as const;

export const useAdminTenantGuidedSetup = (tenantId: number | null) => {
  const { currentTenantId, currentUnitId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(tenantId),
    queryFn: async () => {
      const id = tenantId as number;
      let unitId = currentTenantId === id ? currentUnitId : null;

      if (!unitId) {
        const { data, error } = await supabase
          .from("tenant_units")
          .select("id")
          .eq("tenant_id", id)
          .eq("kind", "matriz")
          .maybeSingle();

        if (error) throw error;
        unitId = data?.id ?? null;
      }

      if (!unitId) return null;

      const [derived, progressResult] = await Promise.all([
        deriveGuidedSetupState(id, unitId).catch(() => null),
        supabase
          .from("tenant_guided_setup_progress")
          .select("completed_at, completed_steps, current_step")
          .eq("tenant_id", id)
          .eq("unit_id", unitId)
          .maybeSingle(),
      ]);

      if (progressResult.error) throw progressResult.error;

      const explicitCompleted = (progressResult.data?.completed_steps ?? []).filter(
        isGuidedSetupStepKey,
      );
      const completedSteps = Array.from(
        new Set([...(derived?.completedSteps ?? []), ...explicitCompleted]),
      ) as GuidedSetupStepKey[];
      const explicitlyFinished = Boolean(
        progressResult.data?.completed_at && progressResult.data.current_step === "completed",
      );

      return {
        activeStep: derived?.activeStep ?? null,
        completedSteps,
        isComplete: isGuidedSetupComplete(completedSteps) || explicitlyFinished,
      };
    },
    queryKey: adminTenantGuidedSetupQueryKey(tenantId as number),
    staleTime: 1000 * 30,
  });
};