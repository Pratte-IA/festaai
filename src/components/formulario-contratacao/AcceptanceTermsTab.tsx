import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  ClipboardCheck,
  Info,
  Pencil,
  Plus,
  Power,
  Trash2,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  defaultAcceptanceTermInput,
  formatAcceptanceTermDate,
  isLockedSystemTerm,
  useCreateTenantAcceptanceTerm,
  useDeleteTenantAcceptanceTerm,
  useReorderTenantAcceptanceTerm,
  useTenantAcceptanceTerms,
  useToggleTenantAcceptanceTermActive,
  useUpdateTenantAcceptanceTerm,
  type TenantAcceptanceTerm,
  type TenantAcceptanceTermInput,
} from "@/features/configuracoes";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { AcceptanceTermEditorDialog } from "./AcceptanceTermEditorDialog";

const TermBadge = ({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: "default" | "muted" | "primary" | "warning" | "outline";
}) => {
  const classes = {
    default: "bg-muted text-muted-foreground",
    muted: "bg-muted/60 text-muted-foreground",
    outline: "border border-border/60 text-muted-foreground bg-transparent",
    primary: "bg-primary/10 text-primary",
    warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  };

  return (
    <span
      className={cn(
        "text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0",
        classes[variant],
      )}
    >
      {children}
    </span>
  );
};

export const AcceptanceTermsTab = () => {
  const { data: terms = [], isLoading } = useTenantAcceptanceTerms();
  const createTerm = useCreateTenantAcceptanceTerm();
  const updateTerm = useUpdateTenantAcceptanceTerm();
  const deleteTerm = useDeleteTenantAcceptanceTerm();
  const reorderTerm = useReorderTenantAcceptanceTerm();
  const toggleTermActive = useToggleTenantAcceptanceTermActive();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<TenantAcceptanceTerm | null>(null);
  const [draft, setDraft] = useState<TenantAcceptanceTermInput>(defaultAcceptanceTermInput());
  const [termToDelete, setTermToDelete] = useState<TenantAcceptanceTerm | null>(null);

  useEffect(() => {
    if (editingTerm) {
      setDraft({
        active: editingTerm.active,
        appearsInContract: editingTerm.appearsInContract,
        content: editingTerm.content,
        isRequired: editingTerm.isRequired,
        sortOrder: editingTerm.sortOrder,
        title: editingTerm.title,
      });
    } else {
      setDraft(defaultAcceptanceTermInput());
    }
  }, [editingTerm]);

  const openCreate = () => {
    setEditingTerm(null);
    setDraft(defaultAcceptanceTermInput());
    setEditorOpen(true);
  };

  const openEdit = (term: TenantAcceptanceTerm) => {
    setEditingTerm(term);
    setEditorOpen(true);
  };

  const handleSave = async () => {
    if (!draft.title.trim() || !draft.content.trim()) {
      toast({ title: "Preencha título e conteúdo", variant: "destructive" });
      return;
    }

    try {
      if (editingTerm) {
        await updateTerm.mutateAsync({ ...editingTerm, ...draft });
        toast({ title: "Aceite atualizado" });
      } else {
        await createTerm.mutateAsync(draft);
        toast({ title: "Aceite criado" });
      }
      setEditorOpen(false);
      setEditingTerm(null);
    } catch (error) {
      toast({
        title: "Nao foi possivel salvar o aceite",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!termToDelete) return;

    try {
      const result = await deleteTerm.mutateAsync(termToDelete);

      if (result.deactivated) {
        toast({
          title: "Aceite inativado",
          description:
            result.reason === "system"
              ? "Termos do sistema nao podem ser excluidos — o termo foi inativado."
              : "Este aceite ja foi referenciado e foi inativado em vez de excluido.",
        });
      } else {
        toast({ title: "Aceite removido" });
      }
    } catch (error) {
      toast({
        title: "Nao foi possivel remover o aceite",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setTermToDelete(null);
    }
  };

  const isMutating =
    createTerm.isPending ||
    updateTerm.isPending ||
    deleteTerm.isPending ||
    reorderTerm.isPending ||
    toggleTermActive.isPending;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex gap-3">
        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden />
        <div className="space-y-1 text-sm">
          <p className="font-medium text-foreground">
            Aceites exibidos ao cliente no formulário de contratação
          </p>
          <p className="text-muted-foreground">
            Configure termos, autorizações e regras que o cliente deverá confirmar ao fechar a
            festa. Os itens marcados como{" "}
            <span className="text-foreground font-medium">Aparece no contrato</span> poderão ser
            reutilizados futuramente no módulo de contrato e assinatura eletrônica.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ClipboardCheck className="h-4 w-4" aria-hidden />
          <span>
            {isLoading ? "Carregando..." : `${terms.length} aceite${terms.length === 1 ? "" : "s"}`}
          </span>
        </div>
        <Button onClick={openCreate} className="gap-2 shrink-0" disabled={isMutating}>
          <Plus className="h-4 w-4" />
          Novo aceite
        </Button>
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Carregando aceites e regras...</p>
      )}

      {!isLoading && terms.length === 0 && (
        <div className="rounded-xl border border-dashed border-border/60 p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum aceite configurado. Os termos padrão devem ser criados automaticamente para
            novos espaços — clique em &quot;Novo aceite&quot; para adicionar regras
            personalizadas.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {terms.map((term, index) => {
          const isInactive = !term.active;
          const locked = isLockedSystemTerm(term);

          return (
            <div
              key={term.id}
              className={cn(
                "rounded-xl border bg-card/40 p-4 flex flex-col sm:flex-row sm:items-start gap-4",
                isInactive ? "border-border/40 opacity-70" : "border-border/60",
              )}
            >
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start gap-2 flex-wrap">
                  <p className="text-sm font-medium text-foreground">{term.title}</p>
                  {term.isRequired ? (
                    <TermBadge variant="primary">Obrigatório</TermBadge>
                  ) : (
                    <TermBadge variant="outline">Opcional</TermBadge>
                  )}
                  {term.appearsInContract ? (
                    <TermBadge variant="default">Aparece no contrato</TermBadge>
                  ) : (
                    <TermBadge variant="muted">Não aparece no contrato</TermBadge>
                  )}
                  {term.isSystem && <TermBadge variant="warning">Sistema</TermBadge>}
                  {isInactive && <TermBadge variant="muted">Inativo</TermBadge>}
                </div>

                <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                  {term.content}
                </p>

                <p className="text-xs text-muted-foreground">
                  Atualizado em {formatAcceptanceTermDate(term.updatedAt)}
                  {term.createdAt !== term.updatedAt && (
                    <> · Criado em {formatAcceptanceTermDate(term.createdAt)}</>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  title="Mover para cima"
                  disabled={index === 0 || reorderTerm.isPending}
                  onClick={async () => {
                    try {
                      await reorderTerm.mutateAsync({ direction: "up", id: term.id });
                    } catch {
                      toast({ title: "Nao foi possivel reordenar", variant: "destructive" });
                    }
                  }}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-40"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Mover para baixo"
                  disabled={index === terms.length - 1 || reorderTerm.isPending}
                  onClick={async () => {
                    try {
                      await reorderTerm.mutateAsync({ direction: "down", id: term.id });
                    } catch {
                      toast({ title: "Nao foi possivel reordenar", variant: "destructive" });
                    }
                  }}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-40"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title={isInactive ? "Ativar aceite" : "Inativar aceite"}
                  disabled={toggleTermActive.isPending || (locked && !isInactive)}
                  onClick={async () => {
                    try {
                      await toggleTermActive.mutateAsync({
                        active: isInactive,
                        term,
                      });
                      toast({
                        title: isInactive ? "Aceite ativado" : "Aceite inativado",
                      });
                    } catch (error) {
                      toast({
                        title: "Nao foi possivel alterar o status",
                        description: error instanceof Error ? error.message : undefined,
                        variant: "destructive",
                      });
                    }
                  }}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-40"
                >
                  <Power className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Editar aceite"
                  onClick={() => openEdit(term)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title={term.isSystem ? "Inativar termo do sistema" : "Excluir aceite"}
                  disabled={locked}
                  onClick={() => setTermToDelete(term)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-40"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <AcceptanceTermEditorDialog
        draft={draft}
        editingTerm={editingTerm}
        isPending={createTerm.isPending || updateTerm.isPending}
        onDraftChange={setDraft}
        onOpenChange={setEditorOpen}
        onSave={handleSave}
        open={editorOpen}
      />

      <AlertDialog open={Boolean(termToDelete)} onOpenChange={(open) => !open && setTermToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {termToDelete?.isSystem ? "Inativar termo do sistema?" : "Excluir aceite?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {termToDelete?.isSystem
                ? `O termo "${termToDelete.title}" não pode ser excluído definitivamente. Deseja inativá-lo?`
                : `Tem certeza que deseja excluir "${termToDelete?.title}"? Se já houver referências em eventos, o aceite será inativado.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              {termToDelete?.isSystem ? "Inativar" : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
