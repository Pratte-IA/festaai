import { useMemo, useState } from "react";
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
} from "@/data/packagesData";
import {
  useCreateTenantAdditional,
  useDeleteTenantAdditional,
  useReorderTenantAdditional,
  useTenantAdditionals,
  useTenantPackages,
  useToggleTenantAdditionalActive,
  useUpdateTenantAdditional,
} from "@/features/configuracoes";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

type AdditionalDraft = Pick<Additional, "name" | "price" | "packageIds">;

const emptyDraft = (): AdditionalDraft => ({
  name: "",
  packageIds: [],
  price: 0,
});

const PackageApplicabilityField = ({
  packages,
  selectedIds,
  onChange,
}: {
  packages: { id: string; name: string }[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) => {
  const togglePackage = (packageId: string, checked: boolean) => {
    if (checked) {
      onChange(Array.from(new Set([...selectedIds, packageId])));
      return;
    }
    onChange(selectedIds.filter((id) => id !== packageId));
  };

  if (packages.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Cadastre ao menos um pacote antes de vincular adicionais.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Label>Aplicável em quais pacotes</Label>
      <div className="grid gap-2 sm:grid-cols-2">
        {packages.map((pkg) => (
          <label
            key={pkg.id}
            className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm"
          >
            <Checkbox
              checked={selectedIds.includes(pkg.id)}
              onCheckedChange={(checked) => togglePackage(pkg.id, checked === true)}
            />
            <span className="truncate">{pkg.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

const formatPackageLabels = (
  packageIds: string[] | undefined,
  packages: { id: string; name: string }[],
) => {
  const ids = packageIds ?? [];
  if (ids.length === 0) return "Todos os pacotes";
  const names = ids
    .map((id) => packages.find((pkg) => pkg.id === id)?.name)
    .filter(Boolean) as string[];
  return names.length > 0 ? names.join(", ") : "Pacotes não encontrados";
};

interface Props {
  adminMode?: boolean;
  hideHeader?: boolean;
}

const AdditionalEditorDialog = ({
  additional,
  onClose,
  onSaved,
  open,
  packages,
}: {
  additional: Additional | null;
  onClose: () => void;
  onSaved: () => void;
  open: boolean;
  packages: { id: string; name: string }[];
}) => {
  const updateAdditional = useUpdateTenantAdditional();
  const [form, setForm] = useState<AdditionalDraft>(() =>
    additional
      ? {
          name: additional.name,
          packageIds: additional.packageIds ?? [],
          price: additional.price,
        }
      : emptyDraft(),
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) onClose();
    else if (additional) {
      setForm({
        name: additional.name,
        packageIds: additional.packageIds ?? [],
        price: additional.price,
      });
    }
  };

  const handleSave = async () => {
    if (!additional || !form.name.trim()) return;
    if ((form.packageIds?.length ?? 0) === 0) {
      toast({
        title: "Selecione ao menos um pacote",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateAdditional.mutateAsync({
        ...additional,
        name: form.name.trim(),
        packageIds: form.packageIds,
        price: form.price,
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
            <Label htmlFor="edit-additional-price">Valor</Label>
            <CurrencyInput
              id="edit-additional-price"
              value={form.price}
              onChange={(price) => setForm({ ...form, price })}
              className="input-base text-sm tabular-nums"
            />
          </div>
          <PackageApplicabilityField
            packages={packages}
            selectedIds={form.packageIds ?? []}
            onChange={(packageIds) => setForm({ ...form, packageIds })}
          />
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
  const { data: packages = [], isLoading: isPackagesLoading } = useTenantPackages({
    includeInactive: adminMode,
  });
  const packageOptions = useMemo(
    () => packages.map((pkg) => ({ id: pkg.id, name: pkg.name })),
    [packages],
  );

  const createAdditional = useCreateTenantAdditional();
  const deleteAdditional = useDeleteTenantAdditional();
  const reorderAdditional = useReorderTenantAdditional();
  const toggleAdditionalActive = useToggleTenantAdditionalActive();
  const [isCreating, setIsCreating] = useState(false);
  const [draft, setDraft] = useState<AdditionalDraft>(emptyDraft());
  const [editingAdditional, setEditingAdditional] = useState<Additional | null>(null);

  const saveAdditional = async () => {
    if (!draft.name.trim()) return;
    if ((draft.packageIds?.length ?? 0) === 0) {
      toast({
        title: "Selecione ao menos um pacote",
        description: "Indique em quais pacotes este adicional pode ser ofertado.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createAdditional.mutateAsync({
        active: true,
        category: "outros",
        name: draft.name.trim(),
        packageIds: draft.packageIds,
        price: draft.price,
        type: "fixo",
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
            disabled={isPackagesLoading || packageOptions.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Novo Adicional
          </button>
        </div>
      )}

      {hideHeader && (
        <div className="flex justify-end">
          <button
            onClick={() => setIsCreating((current) => !current)}
            disabled={isPackagesLoading || packageOptions.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Novo Adicional
          </button>
        </div>
      )}

      {isCreating && (
        <div className="rounded-xl border border-primary/40 bg-card/60 p-4 space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <Label htmlFor="additional-name">Nome</Label>
              <Input
                id="additional-name"
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                placeholder="Nome do adicional"
              />
            </div>
            <div>
              <Label htmlFor="additional-price">Valor</Label>
              <CurrencyInput
                id="additional-price"
                value={draft.price}
                onChange={(price) => setDraft({ ...draft, price })}
                className="input-base text-sm tabular-nums"
              />
            </div>
          </div>
          <PackageApplicabilityField
            packages={packageOptions}
            selectedIds={draft.packageIds ?? []}
            onChange={(packageIds) => setDraft({ ...draft, packageIds })}
          />
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
        {(isLoading || isPackagesLoading) && (
          <p className="text-sm text-muted-foreground">Carregando adicionais...</p>
        )}
        {!isLoading && !isPackagesLoading && additionals.length === 0 && (
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
                  {isInactive && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 bg-muted text-muted-foreground">
                      Inativo
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <span className="text-base font-bold text-foreground block">
                    {formatCurrency(item.price)}
                  </span>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {formatPackageLabels(item.packageIds, packageOptions)}
                  </p>
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
        packages={packageOptions}
        onClose={() => setEditingAdditional(null)}
        onSaved={() => setEditingAdditional(null)}
      />
    </div>
  );
};

export default AdditionalsConfig;
