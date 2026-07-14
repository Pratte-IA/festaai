import { useState } from "react";
import { Check, Copy, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  formatPostPartyAutomationEffectiveDateBR,
  isPostPartyAutomationActive,
} from "@/features/eventos/post-party-automation";
import { buildPublicSatisfactionSurveyUrl } from "@/features/public-satisfaction-survey";
import { useCurrentTenant } from "@/features/tenants";
import { toast } from "@/hooks/use-toast";

interface PublicSurveyLinkCardProps {
  eventoId: number;
}

export const PublicSurveyLinkCard = ({ eventoId }: PublicSurveyLinkCardProps) => {
  const { currentTenant } = useCurrentTenant();
  const [copied, setCopied] = useState(false);

  if (!currentTenant?.slug) return null;

  const publicUrl = buildPublicSatisfactionSurveyUrl(currentTenant.slug, eventoId);
  const automationActive = isPostPartyAutomationActive();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast({
        title: "Link copiado",
        description: "Envie este endereço à família para responder a pesquisa pós-festa.",
      });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Não foi possível copiar",
        description: "Copie manualmente o link exibido.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-3 mt-4">
      <div className="flex items-start gap-3">
        <Star className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Pesquisa de avaliação pós-festa</p>
          <p className="text-sm text-muted-foreground">
            {automationActive
              ? "Ao responder, o lead avança automaticamente para Prova Social - Marketing."
              : `A pesquisa e a transição automática passam a valer em ${formatPostPartyAutomationEffectiveDateBR()}.`}
          </p>
          <p className="text-xs font-mono text-foreground/80 break-all">{publicUrl}</p>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => void handleCopy()}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copiado" : "Copiar link da pesquisa"}
      </Button>
    </div>
  );
};
