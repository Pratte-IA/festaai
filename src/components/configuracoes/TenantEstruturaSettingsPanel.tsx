import { useEffect, useState } from "react";
import { PackageEstruturaPreview } from "@/components/configuracoes/PackageEstruturaPreview";
import { EstruturaListsForm } from "@/components/configuracoes/EstruturaListsForm";
import {
  SettingsPageHeader,
  SettingsStatChip,
} from "@/components/configuracoes/SettingsPageHeader";
import { Button } from "@/components/ui/button";
import type { EstruturaBlock } from "@/data/packagesData";
import {
  emptyEstruturaBlock,
  useSaveTenantEstruturaSettings,
  useTenantEstruturaSettings,
} from "@/features/configuracoes";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SETTINGS_PAGE_META } from "@/pages/configuracoes/settings-page-meta";

const clone = (e: EstruturaBlock): EstruturaBlock => ({
  brinquedos: [...e.brinquedos],
  espaco: [...e.espaco],
  decoracao: [...e.decoracao],
});

export const TenantEstruturaSettingsPanel = ({
  guidedMode = false,
  onDraftChange,
  showSettingsHeader = false,
}: {
  guidedMode?: boolean;
  onDraftChange?: (draft: EstruturaBlock) => void;
  showSettingsHeader?: boolean;
}) => {
  const { data: saved, isLoading } = useTenantEstruturaSettings();
  const saveMutation = useSaveTenantEstruturaSettings();
  const [draft, setDraft] = useState<EstruturaBlock>(() => emptyEstruturaBlock());

  useEffect(() => {
    if (saved) setDraft(clone(saved));
  }, [saved]);

  useEffect(() => {
    onDraftChange?.(draft);
  }, [draft, onDraftChange]);

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync(draft);
      toast({
        title: "Estrutura salva",
        description: "Os pacotes ativos foram atualizados com esta configuração.",
      });
    } catch (error) {
      const description =
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : "Tente novamente em instantes.";
      toast({
        title: "Não foi possível salvar",
        description,
        variant: "destructive",
      });
    }
  };

  const hasChanges =
    JSON.stringify(saved?.brinquedos ?? []) !== JSON.stringify(draft.brinquedos);

  const canSave = draft.brinquedos.length > 0 && hasChanges;
  const totalItems = draft.brinquedos.length + draft.espaco.length + draft.decoracao.length;

  const saveButton = (className?: string) => (
    <Button
      type="button"
      onClick={() => void handleSave()}
      disabled={saveMutation.isPending || !canSave}
      className={cn("shrink-0", className)}
    >
      {saveMutation.isPending ? "Salvando..." : "Salvar estrutura"}
    </Button>
  );

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando estrutura...</p>;
  }

  return (
    <div className={cn("max-w-6xl", showSettingsHeader ? "space-y-4" : "space-y-8")}>
      {showSettingsHeader && (
        <SettingsPageHeader
          title={SETTINGS_PAGE_META.estrutura.title}
          description={SETTINGS_PAGE_META.estrutura.description}
          renderAction={!guidedMode ? (className) => saveButton(className) : undefined}
          stats={
            <>
              <SettingsStatChip>
                {draft.brinquedos.length}{" "}
                {draft.brinquedos.length === 1 ? "brinquedo" : "brinquedos"}
              </SettingsStatChip>
              <SettingsStatChip>
                {totalItems} {totalItems === 1 ? "item no total" : "itens no total"}
              </SettingsStatChip>
              {hasChanges && <SettingsStatChip>alterações não salvas</SettingsStatChip>}
            </>
          }
        />
      )}
      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-card rounded-xl border border-border/50 p-6">
            {!showSettingsHeader && (
              <>
                <h2 className="text-lg font-semibold text-foreground mb-1">Monte a estrutura padrão</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Ela vale para todas as festas e é aplicada automaticamente aos pacotes ativos ao salvar.
                </p>
              </>
            )}
            <EstruturaListsForm value={draft} onChange={setDraft} />
          </div>
          {!guidedMode && !showSettingsHeader && (
            <div className="flex justify-end">
              {saveButton()}
            </div>
          )}
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
