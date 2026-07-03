import { Loader2 } from "lucide-react";

import SatisfactionSurveyConfig from "@/components/SatisfactionSurveyConfig";
import { SatisfactionSurveyDispatchPreview } from "@/components/pesquisa-avaliacao/SatisfactionSurveyDispatchPreview";
import { GuidedSetupContinueBar } from "@/components/guided-setup/GuidedSetupContinueBar";
import {
  useTenantSatisfactionSurvey,
} from "@/features/configuracoes";
import { useFinishGuidedSetupStep } from "@/features/guided-setup/use-finish-guided-setup-step";
import { toast } from "@/hooks/use-toast";

interface PesquisaAvaliacaoSetupStepProps {
  onCompleted?: () => void;
}

export const PesquisaAvaliacaoSetupStep = ({ onCompleted }: PesquisaAvaliacaoSetupStepProps) => {
  const { data: questions = [], isLoading } = useTenantSatisfactionSurvey();
  const { finishStep, isPending } = useFinishGuidedSetupStep("pesquisa_avaliacao");

  const activeQuestions = questions.filter((question) => question.active);
  const hasSurvey = activeQuestions.length > 0;

  const handleContinue = () => {
    if (!hasSurvey) {
      toast({
        title: "Configure a pesquisa de avaliação",
        description: "Mantenha ao menos uma pergunta ativa antes de continuar.",
        variant: "destructive",
      });
      return;
    }

    void finishStep({
      onSuccess: onCompleted,
      successMessage: "Pesquisa de avaliação configurada.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Carregando pesquisa de avaliação...
      </div>
    );
  }

  return (
    <div data-guided-setup-allowed className="space-y-6">
      <div className="rounded-lg border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
        <p className="text-foreground">
          A <span className="font-medium">pesquisa de avaliação</span> é enviada após a festa para
          medir a satisfação das famílias. Revise o modelo padrão, remova o que não fizer sentido e
          adicione perguntas específicas da sua casa.
        </p>
      </div>
      <SatisfactionSurveyDispatchPreview />
      <SatisfactionSurveyConfig />
      <GuidedSetupContinueBar
        description={
          hasSurvey
            ? `${activeQuestions.length} pergunta${activeQuestions.length === 1 ? "" : "s"} ativa${activeQuestions.length === 1 ? "" : "s"}. Ajuste conforme sua operação.`
            : "Ative ou adicione perguntas para montar a pesquisa pós-festa."
        }
        disabled={!hasSurvey}
        isPending={isPending}
        onContinue={handleContinue}
      />
    </div>
  );
};
