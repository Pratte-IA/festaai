import { useState } from "react";
import { Loader2 } from "lucide-react";

import PackagesConfig from "@/components/PackagesConfig";
import { GuidedSetupContinueBar } from "@/components/guided-setup/GuidedSetupContinueBar";
import { useTenantPackages } from "@/features/configuracoes";
import { useFinishGuidedSetupStep } from "@/features/guided-setup/use-finish-guided-setup-step";
import { toast } from "@/hooks/use-toast";

interface PackagesSetupStepProps {
  onCompleted?: () => void;
}

export const PackagesSetupStep = ({ onCompleted }: PackagesSetupStepProps) => {
  const { data: packages = [], isLoading } = useTenantPackages();
  const { finishStep, isPending } = useFinishGuidedSetupStep("packages");
  const [wizardOpen, setWizardOpen] = useState(false);

  const handleContinue = () => {
    if (packages.length === 0) {
      toast({
        title: "Crie ao menos um pacote",
        description: "Use o assistente para cadastrar seu primeiro pacote antes de continuar.",
        variant: "destructive",
      });
      return;
    }

    void finishStep({ onSuccess: onCompleted, successMessage: "Pacotes configurados." });
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Carregando pacotes...
      </div>
    );
  }

  return (
    <div data-guided-setup-allowed className="space-y-6">
      <PackagesConfig
        hideHeader
        guidedMode
        guidedContinuePending={isPending}
        onGuidedContinue={handleContinue}
        onWizardStateChange={({ isOpen }) => setWizardOpen(isOpen)}
      />
      {!wizardOpen && (
        <GuidedSetupContinueBar
          description={
            packages.length === 0
              ? "Comece criando seu primeiro pacote com o assistente acima."
              : `${packages.length} pacote${packages.length === 1 ? "" : "s"} cadastrado${packages.length === 1 ? "" : "s"}. Você pode editar depois em Configurações.`
          }
          disabled={packages.length === 0}
          isPending={isPending}
          onContinue={handleContinue}
        />
      )}
    </div>
  );
};
