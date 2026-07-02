import { Loader2 } from "lucide-react";

import {
  AutomationTemplateBindingsPanel,
  useAutomationTemplateBindingsManager,
} from "@/components/automations/AutomationTemplateBindingsPanel";
import { GuidedSetupContinueBar } from "@/components/guided-setup/GuidedSetupContinueBar";
import { useFinishGuidedSetupStep } from "@/features/guided-setup/use-finish-guided-setup-step";
import { toast } from "@/hooks/use-toast";

interface AutomacoesSetupStepProps {
  onCompleted?: () => void;
}

export const AutomacoesSetupStep = ({ onCompleted }: AutomacoesSetupStepProps) => {
  const manager = useAutomationTemplateBindingsManager();
  const { allConfigured, isLoading, isSaving } = manager;
  const { finishStep, isPending } = useFinishGuidedSetupStep("automacoes");

  const handleContinue = () => {
    if (!allConfigured) {
      toast({
        title: "Vincule todas as automações",
        description:
          "Selecione um número WhatsApp para cada automação e informe o celular do vendedor.",
        variant: "destructive",
      });
      return;
    }

    void finishStep({
      onSuccess: onCompleted,
      successMessage: "Configuração inicial concluída!",
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Carregando automações...
      </div>
    );
  }

  return (
    <div data-guided-setup-allowed className="max-w-4xl space-y-6">
      <div className="rounded-lg border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
        <p className="text-foreground">
          Defina qual número WhatsApp da casa dispara cada automação. Para{" "}
          <span className="font-medium">Passar para o Vendedor</span>, informe o celular particular
          de quem recebe o encaminhamento.
        </p>
      </div>

      <AutomationTemplateBindingsPanel
        manager={manager}
        showSettingsWhatsappLink={false}
        showN8nEditorLink={false}
      />

      <GuidedSetupContinueBar
        description={
          allConfigured
            ? "Todos os vínculos configurados. Finalize a configuração inicial."
            : "Vincule as quatro automações antes de continuar."
        }
        disabled={!allConfigured}
        isPending={isPending || isSaving}
        onContinue={handleContinue}
      />
    </div>
  );
};
