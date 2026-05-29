import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Pencil,
  Plus,
  Power,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  defaultPaymentMethodInput,
  paymentMethodTypeLabels,
  useCreateTenantPaymentMethod,
  useDeleteTenantPaymentMethod,
  useReorderTenantPaymentMethod,
  useTenantPaymentMethods,
  useToggleTenantPaymentMethodActive,
  useUpdateTenantPaymentMethod,
  type PaymentMethodType,
  type TenantPaymentMethod,
  type TenantPaymentMethodInput,
} from "@/features/configuracoes";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { PaymentMethodEditorDialog } from "./PaymentMethodEditorDialog";

const formatPercent = (value: number | null) =>
  value == null ? "—" : `${value.toLocaleString("pt-BR")}%`;

const formatCurrency = (value: number | null) =>
  value == null
    ? "—"
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export const PaymentMethodsConfig = () => {
  const { data: methods = [], isLoading } = useTenantPaymentMethods();
  const createMethod = useCreateTenantPaymentMethod();
  const updateMethod = useUpdateTenantPaymentMethod();
  const deleteMethod = useDeleteTenantPaymentMethod();
  const reorderMethod = useReorderTenantPaymentMethod();
  const toggleMethodActive = useToggleTenantPaymentMethodActive();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<TenantPaymentMethod | null>(null);
  const [draft, setDraft] = useState<TenantPaymentMethodInput>(defaultPaymentMethodInput());

  useEffect(() => {
    if (editingMethod) {
      setDraft({
        active: editingMethod.active,
        allowedForDeposit: editingMethod.allowedForDeposit,
        allowedForRemainingBalance: editingMethod.allowedForRemainingBalance,
        allowsInstallments: editingMethod.allowsInstallments,
        feeFixed: editingMethod.feeFixed,
        feePercentage: editingMethod.feePercentage,
        maxInstallments: editingMethod.maxInstallments,
        name: editingMethod.name,
        notes: editingMethod.notes,
        paymentType: editingMethod.paymentType,
        sortOrder: editingMethod.sortOrder,
      });
    } else {
      setDraft(defaultPaymentMethodInput());
    }
  }, [editingMethod]);

  const openCreate = () => {
    setEditingMethod(null);
    setDraft(defaultPaymentMethodInput());
    setEditorOpen(true);
  };

  const openEdit = (method: TenantPaymentMethod) => {
    setEditingMethod(method);
    setEditorOpen(true);
  };

  const handleSave = async () => {
    if (!draft.name.trim()) {
      toast({ title: "Informe o nome do método", variant: "destructive" });
      return;
    }

    try {
      if (editingMethod) {
        await updateMethod.mutateAsync({ ...editingMethod, ...draft, name: draft.name.trim() });
        toast({ title: "Método de pagamento atualizado" });
      } else {
        await createMethod.mutateAsync({ ...draft, name: draft.name.trim() });
        toast({ title: "Método de pagamento criado" });
      }
      setEditorOpen(false);
      setEditingMethod(null);
    } catch {
      toast({
        title: "Nao foi possivel salvar o método de pagamento",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">Métodos de pagamento</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Catálogo de formas aceitas para entrada e saldo restante.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Novo método
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando métodos...</p>}

      {!isLoading && methods.length === 0 && (
        <div className="rounded-xl border border-dashed border-border/60 p-8 text-center">
          <p className="text-sm text-muted-foreground">Nenhum método de pagamento cadastrado.</p>
        </div>
      )}

      <div className="space-y-2">
        {methods.map((method, index) => {
          const isInactive = !method.active;

          return (
            <div
              key={method.id}
              className={cn(
                "rounded-xl border bg-card/40 p-4 flex flex-col sm:flex-row sm:items-center gap-4",
                isInactive ? "border-border/40 opacity-70" : "border-border/60",
              )}
            >
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-foreground">{method.name}</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-primary/10 text-primary">
                    {paymentMethodTypeLabels[method.paymentType as PaymentMethodType]}
                  </span>
                  {method.allowsInstallments && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">
                      Até {method.maxInstallments ?? "—"}x
                    </span>
                  )}
                  {isInactive && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">
                      Inativo
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>Taxa: {formatPercent(method.feePercentage)}</span>
                  <span>Taxa fixa: {formatCurrency(method.feeFixed)}</span>
                  <span>
                    Entrada: {method.allowedForDeposit ? "Sim" : "Não"} · Saldo:{" "}
                    {method.allowedForRemainingBalance ? "Sim" : "Não"}
                  </span>
                </div>
                {method.notes && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{method.notes}</p>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  title="Mover para cima"
                  disabled={index === 0 || reorderMethod.isPending}
                  onClick={async () => {
                    try {
                      await reorderMethod.mutateAsync({ direction: "up", id: method.id });
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
                  disabled={index === methods.length - 1 || reorderMethod.isPending}
                  onClick={async () => {
                    try {
                      await reorderMethod.mutateAsync({ direction: "down", id: method.id });
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
                  title={isInactive ? "Ativar método" : "Inativar método"}
                  disabled={toggleMethodActive.isPending}
                  onClick={async () => {
                    try {
                      await toggleMethodActive.mutateAsync({
                        active: isInactive,
                        id: method.id,
                      });
                      toast({
                        title: isInactive ? "Método ativado" : "Método inativado",
                      });
                    } catch {
                      toast({
                        title: "Nao foi possivel alterar o status",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
                >
                  <Power className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Editar método"
                  onClick={() => openEdit(method)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Excluir método"
                  onClick={async () => {
                    try {
                      await deleteMethod.mutateAsync(method.id);
                      toast({ title: "Método removido" });
                    } catch {
                      toast({
                        title: "Nao foi possivel remover o método",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <PaymentMethodEditorDialog
        draft={draft}
        isEditing={Boolean(editingMethod)}
        isPending={createMethod.isPending || updateMethod.isPending}
        onDraftChange={setDraft}
        onOpenChange={setEditorOpen}
        onSave={handleSave}
        open={editorOpen}
      />
    </div>
  );
};
