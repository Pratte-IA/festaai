import { useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCurrentTenant } from "@/features/tenants";
import { buildPublicFormUrl } from "@/features/public-contract-form";
import { toast } from "@/hooks/use-toast";

export const PublicFormLinkCard = () => {
  const { currentTenant } = useCurrentTenant();
  const [copied, setCopied] = useState(false);

  if (!currentTenant?.slug) return null;

  const publicUrl = buildPublicFormUrl(currentTenant.slug);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast({
        title: "Link copiado",
        description: "Envie este endereço ao cliente para preencher o formulário padrão.",
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
    <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Link2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Formulário público para o cliente</p>
          <p className="text-sm text-muted-foreground">
            Ao preencher, o sistema localiza o lead em Vendas pelo telefone (incluindo perdidos) e
            move para Festa → Boas Vindas. Se já existir cadastro em Festa com o mesmo telefone,
            atualiza esse registro. Caso contrário, cria um novo em Boas Vindas.
          </p>
          <p className="text-xs font-mono text-foreground/80 break-all">{publicUrl}</p>
        </div>
      </div>
      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => void handleCopy()}>
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copiado" : "Copiar link"}
      </Button>
    </div>
  );
};
