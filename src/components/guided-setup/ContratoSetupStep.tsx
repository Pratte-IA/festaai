import { Loader2 } from "lucide-react";

import { ContractModelsReviewStep } from "@/components/contracts/ContractModelsReviewStep";
import { ContractModelsSetupPrompt } from "@/components/contracts/ContractModelsSetupPrompt";
import { ContractModuleTermsPrompt } from "@/components/contracts/ContractModuleTermsPrompt";
import { GuidedSetupContinueBar } from "@/components/guided-setup/GuidedSetupContinueBar";
import {
  defaultTenantContractTemplateParams,
  isTenantContractTemplateParamsComplete,
} from "@/features/eventos/contracts/contract-template-params";
import {
  useIsContractModuleReady,
  useNeedsContractModelsReview,
  useRestartContractModuleSetup,
  useTenantContractModuleSettings,
  useTenantContractTypeOptions,
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
  const { data: moduleSettings } = useTenantContractModuleSettings();
  const { data: typeOptions = [] } = useTenantContractTypeOptions();
  const { completedSteps } = useIsGuidedSetupComplete();
  const { finishStep, isPending } = useFinishGuidedSetupStep("contrato");
  const restartSetup = useRestartContractModuleSetup();
  const reopenStep = useReopenGuidedSetupStep();

  const isGuidedStepComplete = completedSteps.includes("contrato");

  const requiresFestaCompletaFields = typeOptions
    .filter((option) => option.enabled)
    .some((option) => option.key === "aluguel_espaco_festa_completa");

  const savedParams = moduleSettings?.templateParams ?? defaultTenantContractTemplateParams();
  const areParamsComplete = isTenantContractTemplateParamsComplete(savedParams, {
    requiresFestaCompletaFields,
  });

  const canFinishGuidedStep = isEnabled && areParamsComplete && isModelsConfigured && isTermsAccepted;

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
      <div data-guided-setup-allowed className="space-y-6">
        {!areParamsComplete ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-foreground">
            Preencha e salve todos os parâmetros dos modelos de contrato antes de aceitar os termos
            do módulo.
          </div>
        ) : null}
        <ContractModelsReviewStep mode="edit" onRestartSetup={handleRestartSetup} />
        {areParamsComplete ? (
          <ContractModuleTermsPrompt />
        ) : null}
      </div>
    );
  }

  return (
    <div data-guided-setup-allowed className="space-y-6">
      <ContractModelsReviewStep mode="edit" onRestartSetup={handleRestartSetup} />

      {!isGuidedStepComplete ? (
        <GuidedSetupContinueBar
          description={
            !areParamsComplete
              ? "Preencha e salve todos os parâmetros do contrato para concluir esta etapa."
              : !isModelsConfigured
                ? "Conclua a revisão dos modelos antes de avançar."
                : "Parâmetros salvos. Continue para configurar o formulário de contratação."
          }
          disabled={!canFinishGuidedStep}
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
