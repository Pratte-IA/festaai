import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import { GuidedSetupContinueBar } from "@/components/guided-setup/GuidedSetupContinueBar";
import { FinancialSettingsConfig } from "@/pages/configuracoes/financial-settings-config";
import { useTenantFinancialSettings } from "@/features/configuracoes";
import { useFinishGuidedSetupStep } from "@/features/guided-setup/use-finish-guided-setup-step";

interface FinanceiroSetupStepProps {
  onCompleted?: () => void;
}

export const FinanceiroSetupStep = ({ onCompleted }: FinanceiroSetupStepProps) => {
  const { isLoading } = useTenantFinancialSettings();
  const { finishStep, isPending: isFinishingStep } = useFinishGuidedSetupStep("financeiro");
  const saveActionsRef = useRef<{
    save: () => Promise<boolean>;
    isPending: boolean;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleContinue = async () => {
    const actions = saveActionsRef.current;
    if (!actions) return;

    const saved = await actions.save();
    if (!saved) return;

    void finishStep({
      onSuccess: onCompleted,
      successMessage: "Regras financeiras configuradas.",
    });
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
      <FinancialSettingsConfig
        guidedMode
        onRegisterActions={(actions) => {
          saveActionsRef.current = actions;
          setIsSaving(actions.isPending);
        }}
      />
      <GuidedSetupContinueBar
        description="Defina as regras padrão de entrada, restante e parcelamento. Ao continuar, elas serão salvas."
        isPending={isSaving || isFinishingStep}
        onContinue={() => void handleContinue()}
      />
    </div>
  );
};
