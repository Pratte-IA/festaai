import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Pencil,
  Plus,
  Power,
  Trash2,
} from "lucide-react";

import {
  Additional,
  additionalBillingTypeLabels,
  additionalCategoryLabels,
  AdditionalBillingType,
  AdditionalCategory,
} from "@/data/packagesData";
import {
  useCreateTenantAdditional,
  useDeleteTenantAdditional,
  useReorderTenantAdditional,
  useTenantAdditionals,
  useToggleTenantAdditionalActive,
  useUpdateTenantAdditional,
} from "@/features/configuracoes";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const emptyDraft = (): Omit<Additional, "id"> => ({
  active: true,
  category: "outros",
  description: "",
  isRequired: false,
  name: "",
  price: 0,
  type: "fixo",
});

interface Props {
  adminMode?: boolean;
  hideHeader?: boolean;
}

const AdditionalEditorDialog = ({
  additional,
  onClose,
  onSaved,
  open,
}: {
  additional: Additional | null;
  onClose: () => void;
  onSaved: () => void;
  open: boolean;
}) => {
  const updateAdditional = useUpdateTenantAdditional();
  const [form, setForm] = useState<Omit<Additional, "id">>(() =>
    additional
      ? {
          active: additional.active ?? true,
          category: additional.category,
          description: additional.description ?? "",
          isRequired: additional.isRequired ?? false,
          name: additional.name,
          price: additional.price,
          sortOrder: additional.sortOrder,
          type: additional.type,
        }
      : emptyDraft(),
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) onClose();
    else if (additional) {
      setForm({
        active: additional.active ?? true,
        category: additional.category,
        description: additional.description ?? "",
        isRequired: additional.isRequired ?? false,
        name: additional.name,
        price: additional.price,
        sortOrder: additional.sortOrder,
        type: additional.type,
      });
    }
  };

  const handleSave = async () => {
    if (!additional || !form.name.trim()) return;

    try {
      await updateAdditional.mutateAsync({
        ...additional,
        ...form,
        description: form.description?.trim() || null,
      });
      toast({ title: "Adicional atualizado" });
      onSaved();
      onClose();
    } catch {
      toast({ title: "Nao foi possivel salvar o adicional", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar adicional</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-additional-name">Nome</Label>
            <Input
              id="edit-additional-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="edit-additional-description">Descrição</Label>
            <Textarea
              id="edit-additional-description"
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="edit-additional-price">Valor</Label>
              <Input
                id="edit-additional-price"
                min="0"
                step="0.01"
                type="number"
                value={form.price || ""}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="edit-additional-category">Categoria</Label>
              <select
                id="edit-additional-category"
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value as AdditionalCategory })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {(Object.keys(additionalCategoryLabels) as AdditionalCategory[]).map((key) => (
                  <option key={key} value={key}>
                    {additionalCategoryLabels[key]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="edit-additional-type">Tipo de cobrança</Label>
            <select
              id="edit-additional-type"
              value={form.type}
              onChange={(e) =>
                setForm({ ...form, type: e.target.value as AdditionalBillingType })
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {(Object.keys(additionalBillingTypeLabels) as AdditionalBillingType[]).map((key) => (
                <option key={key} value={key}>
                  {additionalBillingTypeLabels[key]}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.isRequired ?? false}
              onCheckedChange={(checked) => setForm({ ...form, isRequired: checked === true })}
            />
            Obrigatório no formulário
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={updateAdditional.isPending || !form.name.trim()}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const AdditionalsConfig = ({ adminMode = false, hideHeader }: Props) => {
  const { data: additionals = [], isLoading } = useTenantAdditionals({
    includeInactive: adminMode,
  });
  const createAdditional = useCreateTenantAdditional();
  const deleteAdditional = useDeleteTenantAdditional();
  const reorderAdditional = useReorderTenantAdditional();
  const toggleAdditionalActive = useToggleTenantAdditionalActive();
  const [isCreating, setIsCreating] = useState(false);
  const [draft, setDraft] = useState<Omit<Additional, "id">>(emptyDraft());
  const [editingAdditional, setEditingAdditional] = useState<Additional | null>(null);

  const saveAdditional = async () => {
    if (!draft.name.trim()) return;

    try {
      await createAdditional.mutateAsync({
        ...draft,
        description: draft.description?.trim() || null,
      });
      toast({ title: "Adicional salvo" });
      setDraft(emptyDraft());
      setIsCreating(false);
    } catch {
      toast({
        title: "Nao foi possivel salvar o adicional",
        description: "Revise os dados e tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-5">
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Adicionais</h2>
          <button
            onClick={() => setIsCreating((current) => !current)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Novo Adicional
          </button>
        </div>
      )}

      {hideHeader && (
        <div className="flex justify-end">
          <button
            onClick={() => setIsCreating((current) => !current)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Novo Adicional
          </button>
        </div>
      )}

      {isCreating && (
        <div className="rounded-xl border border-primary/40 bg-card/60 p-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Input
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              placeholder="Nome do adicional"
            />
            <Input
              min="0"
              step="0.01"
              type="number"
              value={draft.price || ""}
              onChange={(event) => setDraft({ ...draft, price: Number(event.target.value) })}
              placeholder="Valor"
            />
          </div>
          <Textarea
            value={draft.description ?? ""}
            onChange={(event) => setDraft({ ...draft, description: event.target.value })}
            placeholder="Descrição (opcional)"
            rows={2}
          />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <select
              value={draft.category}
              onChange={(event) =>
                setDraft({ ...draft, category: event.target.value as AdditionalCategory })
              }
              className="rounded-lg border border-border/60 bg-background/50 p-2.5 text-sm text-foreground"
            >
              {(Object.keys(additionalCategoryLabels) as AdditionalCategory[]).map((key) => (
                <option key={key} value={key}>
                  {additionalCategoryLabels[key]}
                </option>
              ))}
            </select>
            <select
              value={draft.type}
              onChange={(event) =>
                setDraft({ ...draft, type: event.target.value as AdditionalBillingType })
              }
              className="rounded-lg border border-border/60 bg-background/50 p-2.5 text-sm text-foreground"
            >
              {(Object.keys(additionalBillingTypeLabels) as AdditionalBillingType[]).map((key) => (
                <option key={key} value={key}>
                  {additionalBillingTypeLabels[key]}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={draft.isRequired ?? false}
              onCheckedChange={(checked) => setDraft({ ...draft, isRequired: checked === true })}
            />
            Obrigatório no formulário
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreating(false)}>
              Cancelar
            </Button>
            <Button onClick={saveAdditional} disabled={createAdditional.isPending}>
              Salvar
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando adicionais...</p>}
        {!isLoading && additionals.length === 0 && (
          <div className="rounded-xl border border-dashed border-border/60 p-8 text-center md:col-span-2 lg:col-span-3">
            <p className="text-sm text-muted-foreground">Nenhum adicional cadastrado.</p>
          </div>
        )}
        {additionals.map((item, index) => {
          const isInactive = item.active === false;

          return (
            <div
              key={item.id}
              className={cn(
                "rounded-xl border bg-card/40 p-4 flex items-start justify-between gap-3 hover:border-border transition-colors",
                isInactive ? "border-border/40 opacity-70" : "border-border/60",
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <h4 className="text-sm font-medium text-foreground truncate">{item.name}</h4>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 bg-primary/10 text-primary">
                    {additionalBillingTypeLabels[item.type]}
                  </span>
                  {item.isRequired && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 bg-amber-500/10 text-amber-700 dark:text-amber-400">
                      Obrigatório
                    </span>
                  )}
                  {isInactive && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 bg-muted text-muted-foreground">
                      Inativo
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-xs text-muted-foreground mb-1.5 line-clamp-2">{item.description}</p>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-foreground">
                    {formatCurrency(item.price)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {additionalCategoryLabels[item.category] ?? item.category}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                {adminMode && (
                  <>
                    <button
                      type="button"
                      title="Mover para cima"
                      disabled={index === 0 || reorderAdditional.isPending}
                      onClick={async () => {
                        try {
                          await reorderAdditional.mutateAsync({ direction: "up", id: item.id });
                        } catch {
                          toast({ title: "Nao foi possivel reordenar", variant: "destructive" });
                        }
                      }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-40"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Mover para baixo"
                      disabled={index === additionals.length - 1 || reorderAdditional.isPending}
                      onClick={async () => {
                        try {
                          await reorderAdditional.mutateAsync({ direction: "down", id: item.id });
                        } catch {
                          toast({ title: "Nao foi possivel reordenar", variant: "destructive" });
                        }
                      }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-40"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title={isInactive ? "Ativar adicional" : "Inativar adicional"}
                      disabled={toggleAdditionalActive.isPending}
                      onClick={async () => {
                        try {
                          await toggleAdditionalActive.mutateAsync({
                            active: isInactive,
                            id: item.id,
                          });
                          toast({
                            title: isInactive ? "Adicional ativado" : "Adicional inativado",
                          });
                        } catch {
                          toast({
                            title: "Nao foi possivel alterar o status",
                            variant: "destructive",
                          });
                        }
                      }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    >
                      <Power className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  title="Editar adicional"
                  onClick={() => setEditingAdditional(item)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Excluir adicional"
                  onClick={async () => {
                    try {
                      await deleteAdditional.mutateAsync(item.id);
                      toast({ title: "Adicional removido" });
                    } catch {
                      toast({
                        title: "Nao foi possivel remover o adicional",
                        description: "Tente novamente em instantes.",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <AdditionalEditorDialog
        additional={editingAdditional}
        open={Boolean(editingAdditional)}
        onClose={() => setEditingAdditional(null)}
        onSaved={() => setEditingAdditional(null)}
      />
    </div>
  );
};

export default AdditionalsConfig;
