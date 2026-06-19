import { Loader2 } from "lucide-react";

import { ContractModelsReviewStep } from "@/components/contracts/ContractModelsReviewStep";
import { ContractModelsSetupPrompt } from "@/components/contracts/ContractModelsSetupPrompt";
import { ContractModuleTermsGate } from "@/components/contracts/ContractModuleTermsGate";
import {
  useIsContractModuleModelsConfigured,
  useNeedsContractModelsReview,
} from "@/features/eventos/use-tenant-contract-module-settings";

interface ContractModuleGateProps {
  children: React.ReactNode;
}

export const ContractModuleGate = ({ children }: ContractModuleGateProps) => {
  const { isConfigured, isLoading, error } = useIsContractModuleModelsConfigured();
  const { isLoading: isReviewLoading, needsReview } = useNeedsContractModelsReview();

  if (isLoading || isReviewLoading) {
    return (
      <div className="flex h-[420px] items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Verificando configuração do módulo de contratos...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        Não foi possível verificar a configuração dos modelos. Tente novamente em instantes.
      </div>
    );
  }

  if (!isConfigured && needsReview) {
    return <ContractModelsReviewStep />;
  }

  if (!isConfigured) {
    return <ContractModelsSetupPrompt />;
  }

  return <ContractModuleTermsGate>{children}</ContractModuleTermsGate>;
};
