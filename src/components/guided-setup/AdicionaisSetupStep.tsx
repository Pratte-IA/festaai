import { Loader2 } from "lucide-react";

import AdditionalsConfig from "@/components/AdditionalsConfig";
import { GuidedSetupContinueBar } from "@/components/guided-setup/GuidedSetupContinueBar";
import { useTenantAdditionals } from "@/features/configuracoes";
import { useFinishGuidedSetupStep } from "@/features/guided-setup/use-finish-guided-setup-step";

interface AdicionaisSetupStepProps {
  onCompleted?: () => void;
}

export const AdicionaisSetupStep = ({ onCompleted }: AdicionaisSetupStepProps) => {
  const { data: additionals = [], isLoading } = useTenantAdditionals();
  const { finishStep, isPending } = useFinishGuidedSetupStep("adicionais");

  const handleContinue = () => {
    void finishStep({
      onSuccess: onCompleted,
      successMessage: "Adicionais configurados.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Carregando adicionais...
      </div>
    );
  }

  return (
    <div data-guided-setup-allowed className="space-y-6">
      <AdditionalsConfig hideHeader />
      <GuidedSetupContinueBar
        description={
          additionals.length === 0
            ? "Cadastre itens extras opcionais ou continue se o seu pacote já inclui tudo no valor."
            : `${additionals.length} adicional${additionals.length === 1 ? "" : "is"} no catálogo. Você pode editar depois em Configurações.`
        }
        isPending={isPending}
        onContinue={handleContinue}
      />
    </div>
  );
};
