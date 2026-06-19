import { Loader2 } from "lucide-react";

import ChecklistConfig from "@/components/ChecklistConfig";
import { GuidedSetupContinueBar } from "@/components/guided-setup/GuidedSetupContinueBar";
import { useTenantChecklist, useTenantPackages } from "@/features/configuracoes";
import { useFinishGuidedSetupStep } from "@/features/guided-setup/use-finish-guided-setup-step";
import { toast } from "@/hooks/use-toast";

interface ChecklistSetupStepProps {
  onCompleted?: () => void;
}

export const ChecklistSetupStep = ({ onCompleted }: ChecklistSetupStepProps) => {
  const { data: packages = [], isLoading: isLoadingPackages } = useTenantPackages();
  const firstPackageId = packages[0]?.id ?? null;
  const { data: categories = [], isLoading: isLoadingChecklist } = useTenantChecklist(firstPackageId);
  const { finishStep, isPending } = useFinishGuidedSetupStep("checklist");

  const isLoading = isLoadingPackages || isLoadingChecklist;
  const hasChecklist = categories.length > 0;

  const handleContinue = () => {
    if (!hasChecklist) {
      toast({
        title: "Configure o checklist",
        description: "Adicione ao menos uma categoria no checklist antes de continuar.",
        variant: "destructive",
      });
      return;
    }

    void finishStep({ onSuccess: onCompleted, successMessage: "Checklist configurado." });
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Carregando checklist...
      </div>
    );
  }

  return (
    <div data-guided-setup-allowed className="space-y-6">
      <div className="rounded-lg border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
        <p className="text-foreground">
          O <span className="font-medium">checklist</span> é a lista de tarefas que você precisa executar
          para organizar cada festa. Cada evento usa este modelo — marque o que já foi feito
          conforme a preparação avança.
        </p>
        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Exemplos
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>Contratar decoradora e alinhar o tema com a família</li>
          <li>Confirmar salgados, doces, bolo e bebidas do buffet</li>
          <li>Organizar a equipe da festa: recepcionista, copeira e monitora</li>
        </ul>
      </div>
      <ChecklistConfig />
      <GuidedSetupContinueBar
        description={
          hasChecklist
            ? `${categories.length} categoria${categories.length === 1 ? "" : "s"} no checklist. Ajuste conforme sua operação.`
            : "Revise ou crie categorias e itens para o checklist padrão dos eventos."
        }
        disabled={!hasChecklist}
        isPending={isPending}
        onContinue={handleContinue}
      />
    </div>
  );
};
