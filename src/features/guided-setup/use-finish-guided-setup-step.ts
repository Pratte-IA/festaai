import { useQueryClient } from "@tanstack/react-query";

import { useCurrentTenant } from "@/features/tenants";
import { toast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/error-message";

import type { GuidedSetupStepKey } from "./guided-setup-steps";
import { guidedSetupQueryKeys } from "./query-keys";
import { useCompleteGuidedSetupStep } from "./use-tenant-guided-setup";

export const useFinishGuidedSetupStep = (stepKey: GuidedSetupStepKey) => {
  const completeStep = useCompleteGuidedSetupStep();
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();

  const finishStep = async (options?: { onSuccess?: () => void; successMessage?: string }) => {
    try {
      await completeStep.mutateAsync({ stepKey });

      await Promise.all([
        queryClient.refetchQueries({
          queryKey: guidedSetupQueryKeys.progress(currentTenantId),
        }),
        queryClient.refetchQueries({
          queryKey: guidedSetupQueryKeys.derived(currentTenantId),
        }),
      ]);

      toast({
        title: options?.successMessage ?? "Etapa concluída com sucesso.",
      });
      options?.onSuccess?.();
    } catch (error) {
      toast({
        title: "Não foi possível concluir a etapa",
        description: getErrorMessage(error, "Revise os dados e tente novamente."),
        variant: "destructive",
      });
    }
  };

  return {
    finishStep,
    isPending: completeStep.isPending,
  };
};
