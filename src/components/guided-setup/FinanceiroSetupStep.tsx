import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { GuidedSetupContinueBar } from "@/components/guided-setup/GuidedSetupContinueBar";
import { FinancialSettingsConfig } from "@/pages/configuracoes/financial-settings-config";
import { useCurrentTenant } from "@/features/tenants";
import { useFinishGuidedSetupStep } from "@/features/guided-setup/use-finish-guided-setup-step";
import { supabase } from "@/lib/supabase/client";
import { toast } from "@/hooks/use-toast";

interface FinanceiroSetupStepProps {
  onCompleted?: () => void;
}

export const FinanceiroSetupStep = ({ onCompleted }: FinanceiroSetupStepProps) => {
  const { currentTenantId } = useCurrentTenant();
  const { finishStep, isPending } = useFinishGuidedSetupStep("financeiro");

  const { data: hasPersistedSettings, isLoading, refetch } = useQuery({
    enabled: Boolean(currentTenantId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenant_financial_settings")
        .select("tenant_id")
        .eq("tenant_id", currentTenantId as number)
        .maybeSingle();

      if (error) throw error;
      return Boolean(data);
    },
    queryKey: ["guided-setup", "financeiro-persisted", currentTenantId],
  });

  const handleContinue = async () => {
    const { data: persisted } = await refetch();

    if (!persisted) {
      toast({
        title: "Salve as regras financeiras",
        description: "Configure e clique em Salvar regras financeiras antes de continuar.",
        variant: "destructive",
      });
      return;
    }

    void finishStep({ onSuccess: onCompleted, successMessage: "Regras financeiras configuradas." });
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Carregando regras financeiras...
      </div>
    );
  }

  return (
    <div data-guided-setup-allowed className="max-w-6xl space-y-6">
      <FinancialSettingsConfig />
      <GuidedSetupContinueBar
        description={
          hasPersistedSettings
            ? "Regras salvas. Você pode ajustar depois em Configurações → Financeiro."
            : "Defina as regras padrão e salve antes de avançar."
        }
        disabled={!hasPersistedSettings}
        isPending={isPending}
        onContinue={handleContinue}
      />
    </div>
  );
};
