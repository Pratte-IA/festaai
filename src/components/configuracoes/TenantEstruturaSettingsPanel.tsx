import { useEffect, useState } from "react";
import { PackageEstruturaPreview } from "@/components/configuracoes/PackageEstruturaPreview";
import { EstruturaListsForm } from "@/components/configuracoes/EstruturaListsForm";
import { Button } from "@/components/ui/button";
import type { EstruturaBlock } from "@/data/packagesData";
import {
  emptyEstruturaBlock,
  useSaveTenantEstruturaSettings,
  useTenantEstruturaSettings,
} from "@/features/configuracoes";
import { toast } from "@/hooks/use-toast";

const clone = (e: EstruturaBlock): EstruturaBlock => ({
  brinquedos: [...e.brinquedos],
  espaco: [...e.espaco],
  decoracao: [...e.decoracao],
});

export const TenantEstruturaSettingsPanel = () => {
  const { data: saved, isLoading } = useTenantEstruturaSettings();
  const saveMutation = useSaveTenantEstruturaSettings();
  const [draft, setDraft] = useState<EstruturaBlock>(() => emptyEstruturaBlock());

  useEffect(() => {
    if (saved) setDraft(clone(saved));
  }, [saved]);

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync(draft);
      toast({
        title: "Estrutura salva",
        description: "Os pacotes ativos foram atualizados com esta configuração.",
      });
    } catch {
      toast({
        title: "Não foi possível salvar",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  };

  const isDirty =
    saved && JSON.stringify(saved.brinquedos) !== JSON.stringify(draft.brinquedos);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando estrutura...</p>;
  }

  return (
    <div className="max-w-6xl space-y-8">
      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-card rounded-xl border border-border/50 p-6">
            <h2 className="text-lg font-semibold text-foreground mb-1">Monte a estrutura padrão</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Ela vale para todas as festas e é aplicada automaticamente aos pacotes ativos ao salvar.
            </p>
            <EstruturaListsForm value={draft} onChange={setDraft} />
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => void handleSave()}
              disabled={saveMutation.isPending || !isDirty}
            >
              {saveMutation.isPending ? "Salvando..." : "Salvar estrutura"}
            </Button>
          </div>
        </div>
        <aside className="lg:col-span-2 space-y-3 lg:sticky lg:top-4 self-start">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Pré-visualização
          </p>
          <PackageEstruturaPreview estrutura={draft} />
          <p className="text-xs text-muted-foreground leading-relaxed">
            No fluxo de novos pacotes, o painel lateral continua espelhando esta lista de brinquedos; a edição fica somente aqui.
          </p>
        </aside>
      </div>
    </div>
  );
};
