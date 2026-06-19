import { useRef } from "react";

import { ContractModuleGate } from "@/components/contracts/ContractModuleGate";
import { FormConfigurationPage } from "@/components/formulario-contratacao/FormConfigurationPage";
import { GuidedSetupContinueBar } from "@/components/guided-setup/GuidedSetupContinueBar";
import { useFinishGuidedSetupStep } from "@/features/guided-setup/use-finish-guided-setup-step";
import { toast } from "@/hooks/use-toast";

interface FormularioSetupStepProps {
  onCompleted?: () => void;
}

export const FormularioSetupStep = ({ onCompleted }: FormularioSetupStepProps) => {
  const { finishStep, isPending } = useFinishGuidedSetupStep("formulario");
  const saveStructureFieldRef = useRef<(() => Promise<boolean>) | null>(null);

  const handleContinue = async () => {
    try {
      if (saveStructureFieldRef.current) {
        await saveStructureFieldRef.current();
      }

      await finishStep({
        onSuccess: onCompleted,
        successMessage: "Formulário de contratação configurado.",
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Opções de resposta incompletas.") return;

      toast({
        title: "Não foi possível continuar",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    }
  };

  return (
    <div data-guided-setup-allowed className="max-w-6xl space-y-6">
      <div className="rounded-lg border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
        <p className="text-foreground">
          O <span className="font-medium">formulário de contratação</span> é o que o cliente preenche
          com os dados da festa — aniversariante, pacote, adicionais e pagamento. Essas informações
          organizam sua operação interna e alimentam o contrato automaticamente.
        </p>
        <p className="mt-2">
          Aqui você configura os campos do formulário e os termos de aceite. Pacotes, adicionais e
          pagamento são definidos nos passos anteriores da configuração guiada — o cliente escolhe
          essas opções no formulário, mas as alterações são feitas diretamente nesses passos.
        </p>
      </div>

      <ContractModuleGate>
        <FormConfigurationPage
          guidedMode
          onRegisterStructureSaveHandler={(handler) => {
            saveStructureFieldRef.current = handler;
          }}
        />
      </ContractModuleGate>

      <GuidedSetupContinueBar
        description="Salve cada pergunta personalizada antes de continuar. «Salvar e continuar» também salva a pergunta pendente."
        isPending={isPending}
        onContinue={() => void handleContinue()}
      />
    </div>
  );
};
