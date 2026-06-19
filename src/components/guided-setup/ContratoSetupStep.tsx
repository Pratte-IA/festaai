import { Loader2 } from "lucide-react";

import { ContractModelsReviewStep } from "@/components/contracts/ContractModelsReviewStep";
import { ContractModelsSetupPrompt } from "@/components/contracts/ContractModelsSetupPrompt";
import { ContractModuleTermsPrompt } from "@/components/contracts/ContractModuleTermsPrompt";
import { GuidedSetupContinueBar } from "@/components/guided-setup/GuidedSetupContinueBar";
import {
  useIsContractModuleReady,
  useNeedsContractModelsReview,
  useRestartContractModuleSetup,
} from "@/features/eventos/use-tenant-contract-module-settings";
import { useIsGuidedSetupComplete } from "@/features/guided-setup";
import { useFinishGuidedSetupStep } from "@/features/guided-setup/use-finish-guided-setup-step";
import { useReopenGuidedSetupStep } from "@/features/guided-setup/use-tenant-guided-setup";
import { toast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/error-message";

interface ContratoSetupStepProps {
  onCompleted?: () => void;
}

export const ContratoSetupStep = ({ onCompleted }: ContratoSetupStepProps) => {
  const { error, isEnabled, isLoading, isModelsConfigured, isTermsAccepted } =
    useIsContractModuleReady();
  const { isLoading: isReviewLoading, needsReview } = useNeedsContractModelsReview();
  const { completedSteps } = useIsGuidedSetupComplete();
  const { finishStep, isPending } = useFinishGuidedSetupStep("contrato");
  const restartSetup = useRestartContractModuleSetup();
  const reopenStep = useReopenGuidedSetupStep();

  const isGuidedStepComplete = completedSteps.includes("contrato");

  const handleRestartSetup = async () => {
    try {
      await restartSetup.mutateAsync();
      await reopenStep.mutateAsync({ stepKey: "contrato" });
      toast({
        title: "Configuração reiniciada",
        description: "Selecione novamente os modelos de contrato para continuar.",
      });
    } catch (restartError) {
      toast({
        title: "Não foi possível reiniciar a configuração",
        description: getErrorMessage(restartError, "Tente novamente em instantes."),
        variant: "destructive",
      });
    }
  };

  if (isLoading || isReviewLoading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Carregando módulo de contratos...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        Não foi possível verificar a configuração do módulo de contratos.
      </div>
    );
  }

  if (!isModelsConfigured && needsReview) {
    return (
      <div data-guided-setup-allowed className="space-y-6">
        <ContractModelsReviewStep
          mode="setup"
          onRestartSetup={handleRestartSetup}
          onReviewCompleted={onCompleted}
        />
      </div>
    );
  }

  if (!isModelsConfigured) {
    return (
      <div data-guided-setup-allowed>
        <ContractModelsSetupPrompt />
      </div>
    );
  }

  if (!isTermsAccepted) {
    return (
      <div data-guided-setup-allowed>
        <ContractModuleTermsPrompt />
      </div>
    );
  }

  return (
    <div data-guided-setup-allowed className="space-y-6">
      <ContractModelsReviewStep
        mode="edit"
        onRestartSetup={handleRestartSetup}
      />

      {!isGuidedStepComplete ? (
        <GuidedSetupContinueBar
          description="Quando terminar de revisar os parâmetros, continue para o checklist."
          disabled={!isEnabled}
          isPending={isPending}
          onContinue={() =>
            void finishStep({
              onSuccess: onCompleted,
              successMessage: "Módulo de contratos configurado.",
            })
          }
        />
      ) : null}
    </div>
  );
};
