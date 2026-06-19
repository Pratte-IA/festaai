import { Loader2 } from "lucide-react";

import { ContractModuleTermsPrompt } from "@/components/contracts/ContractModuleTermsPrompt";
import { useIsContractModuleEnabled } from "@/features/eventos/use-tenant-contract-module-acceptance";

interface ContractModuleTermsGateProps {
  children: React.ReactNode;
}

export const ContractModuleTermsGate = ({ children }: ContractModuleTermsGateProps) => {
  const { data: acceptance, isEnabled, isLoading, error } = useIsContractModuleEnabled();

  if (isLoading) {
    return (
      <div className="flex h-[420px] items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Verificando aceite do módulo de contratos...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        Não foi possível verificar o aceite dos termos. Tente novamente em instantes.
      </div>
    );
  }

  if (!isEnabled || !acceptance) {
    return <ContractModuleTermsPrompt />;
  }

  return children;
};
