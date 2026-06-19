import { useCallback, useState } from "react";
import { Loader2 } from "lucide-react";

import { TenantEstruturaSettingsPanel } from "@/components/configuracoes/TenantEstruturaSettingsPanel";
import { GuidedSetupContinueBar } from "@/components/guided-setup/GuidedSetupContinueBar";
import {
  emptyEstruturaBlock,
  useSaveTenantEstruturaSettings,
  useTenantEstruturaSettings,
} from "@/features/configuracoes";
import { useFinishGuidedSetupStep } from "@/features/guided-setup/use-finish-guided-setup-step";
import type { EstruturaBlock } from "@/data/packagesData";
import { toast } from "@/hooks/use-toast";

interface EstruturaSetupStepProps {
  onCompleted?: () => void;
}

export const EstruturaSetupStep = ({ onCompleted }: EstruturaSetupStepProps) => {
  const { isLoading } = useTenantEstruturaSettings();
  const saveMutation = useSaveTenantEstruturaSettings();
  const { finishStep, isPending: isFinishingStep } = useFinishGuidedSetupStep("estrutura");
  const [draft, setDraft] = useState<EstruturaBlock>(() => emptyEstruturaBlock());

  const handleDraftChange = useCallback((next: EstruturaBlock) => {
    setDraft(next);
  }, []);

  const handleContinue = async () => {
    if (draft.brinquedos.length === 0) {
      toast({
        title: "Adicione ao menos um brinquedo",
        description: "Monte a lista de brinquedos antes de continuar.",
        variant: "destructive",
      });
      return;
    }

    try {
      await saveMutation.mutateAsync(draft);
    } catch {
      toast({
        title: "Não foi possível salvar a estrutura",
        description: "Revise os dados e tente novamente.",
        variant: "destructive",
      });
      return;
    }

    void finishStep({ onSuccess: onCompleted, successMessage: "Estrutura configurada." });
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Carregando estrutura...
      </div>
    );
  }

  return (
    <div data-guided-setup-allowed className="space-y-6">
      <TenantEstruturaSettingsPanel guidedMode onDraftChange={handleDraftChange} />
      <GuidedSetupContinueBar
        description={
          draft.brinquedos.length > 0
            ? "Ao continuar, a estrutura será salva e aplicada aos pacotes ativos."
            : "Monte a lista de brinquedos antes de avançar para a próxima etapa."
        }
        disabled={draft.brinquedos.length === 0}
        isPending={saveMutation.isPending || isFinishingStep}
        onContinue={() => void handleContinue()}
      />
    </div>
  );
};
