import { Loader2 } from "lucide-react";

import { GuidedSetupContinueBar } from "@/components/guided-setup/GuidedSetupContinueBar";
import ConfiguracoesWhatsApp from "@/pages/configuracoes/WhatsApp";
import { useWhatsappConnections } from "@/features/whatsapp-connections";
import { useFinishGuidedSetupStep } from "@/features/guided-setup/use-finish-guided-setup-step";
import { toast } from "@/hooks/use-toast";

interface WhatsappSetupStepProps {
  onCompleted?: () => void;
}

export const WhatsappSetupStep = ({ onCompleted }: WhatsappSetupStepProps) => {
  const { data: connections = [], isLoading } = useWhatsappConnections();
  const { finishStep, isPending } = useFinishGuidedSetupStep("whatsapp");

  const hasConnected = connections.some((connection) => connection.status === "connected");

  const handleContinue = () => {
    if (!hasConnected) {
      toast({
        title: "Conecte o WhatsApp",
        description: "Crie a conexão, escaneie o QR Code e aguarde o status Conectado.",
        variant: "destructive",
      });
      return;
    }

    void finishStep({
      onSuccess: onCompleted,
      successMessage: "WhatsApp conectado.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Carregando conexões WhatsApp...
      </div>
    );
  }

  return (
    <div data-guided-setup-allowed className="space-y-6">
      <ConfiguracoesWhatsApp />
      <GuidedSetupContinueBar
        description={
          hasConnected
            ? "WhatsApp conectado. Continue para vincular as automações aos números."
            : "Crie uma conexão e escaneie o QR Code no aplicativo WhatsApp."
        }
        disabled={!hasConnected}
        isPending={isPending}
        onContinue={handleContinue}
      />
    </div>
  );
};
