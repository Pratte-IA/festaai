import { useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Evento } from "@/features/eventos/types";
import { buildPublicFormUrl } from "@/features/public-contract-form";
import { useCurrentTenant } from "@/features/tenants";
import { toast } from "@/hooks/use-toast";

interface EventoPublicFormLinkCardProps {
  evento: Evento;
}

export const EventoPublicFormLinkCard = ({ evento }: EventoPublicFormLinkCardProps) => {
  const { currentTenant } = useCurrentTenant();
  const [copied, setCopied] = useState(false);

  if (!currentTenant?.slug || evento.funil !== "vendas") return null;

  const publicUrl = buildPublicFormUrl(currentTenant.slug, evento.id);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast({
        title: "Link copiado",
        description: "Ao preencher e assinar o contrato, o cliente conclui a contratação e migra para o funil Festa.",
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
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Link2 className="w-4 h-4 text-festa-blue" />
          Formulário de contratação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Envie este link para o cliente fechar a festa. O sistema vincula automaticamente a este
          lead em Vendas. A migração para Festa → Boas Vindas ocorre somente após a assinatura do contrato.
        </p>
        <p className="text-xs font-mono text-foreground/80 break-all">{publicUrl}</p>
        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => void handleCopy()}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copiado" : "Copiar link do formulário"}
        </Button>
      </CardContent>
    </Card>
  );
};
