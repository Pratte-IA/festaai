import { PropostaFollowupConfig } from "@/components/followup-proposta/PropostaFollowupConfig";
import { GuidedSetupContinueBar } from "@/components/guided-setup/GuidedSetupContinueBar";
import { useFinishGuidedSetupStep } from "@/features/guided-setup/use-finish-guided-setup-step";

interface FollowupPropostaSetupStepProps {
  onCompleted?: () => void;
}

export const FollowupPropostaSetupStep = ({ onCompleted }: FollowupPropostaSetupStepProps) => {
  const { finishStep, isPending } = useFinishGuidedSetupStep("followup_proposta");

  const handleContinue = () => {
    void finishStep({
      onSuccess: onCompleted,
      successMessage: "Follow-ups de proposta configurados.",
    });
  };

  return (
    <div data-guided-setup-allowed className="space-y-6">
      <div className="rounded-lg border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
        <p className="text-foreground">
          Os <span className="font-medium">follow-ups de proposta</span> retomam o contato com leads
          que ainda não responderam após receber a proposta. Revise as mensagens padrão abaixo — você
          pode personalizá-las para o tom da sua casa.
        </p>
        <p className="mt-2">
          Depois, vincule o WhatsApp de envio em <span className="font-medium">Automações</span>.
        </p>
      </div>

      <PropostaFollowupConfig />

      <GuidedSetupContinueBar
        description="Revise as mensagens dos Follow-ups 1 a 4. Você pode editá-las agora ou depois em Configurações → Follow-ups → Comercial."
        isPending={isPending}
        onContinue={handleContinue}
      />
    </div>
  );
};
