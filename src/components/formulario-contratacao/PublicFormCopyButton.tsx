import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCurrentTenant } from "@/features/tenants";
import { buildPublicFormUrl } from "@/features/public-contract-form";
import { toast } from "@/hooks/use-toast";

export const PublicFormCopyButton = () => {
  const { currentTenant } = useCurrentTenant();
  const [copied, setCopied] = useState(false);

  if (!currentTenant?.slug) return null;

  const publicUrl = buildPublicFormUrl(currentTenant.slug);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast({
        title: "Formulário copiado",
        description: "Envie este endereço ao cliente para preencher o formulário.",
      });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Não foi possível copiar",
        description: "Copie manualmente o link do formulário.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button type="button" variant="outline" size="sm" className="gap-2 shrink-0" onClick={() => void handleCopy()}>
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? "Copiado" : "Copiar formulário"}
    </Button>
  );
};
