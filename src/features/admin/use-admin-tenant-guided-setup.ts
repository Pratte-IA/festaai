import { useQuery } from "@tanstack/react-query";

import { deriveGuidedSetupState } from "@/features/guided-setup/derive-guided-setup-state";
import {
  isGuidedSetupComplete,
  isGuidedSetupStepKey,
  type GuidedSetupStepKey,
} from "@/features/guided-setup/guided-setup-steps";
import { supabase } from "@/lib/supabase/client";

export const adminTenantGuidedSetupQueryKey = (tenantId: number) =>
  ["admin", "tenant-guided-setup", tenantId] as const;

export const useAdminTenantGuidedSetup = (tenantId: number | null) =>
  useQuery({
    enabled: Boolean(tenantId),
    queryFn: async () => {
      const id = tenantId as number;
      const [derived, progressResult] = await Promise.all([
        deriveGuidedSetupState(id).catch(() => null),
        supabase
          .from("tenant_guided_setup_progress")
          .select("completed_at, completed_steps, current_step")
          .eq("tenant_id", id)
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
