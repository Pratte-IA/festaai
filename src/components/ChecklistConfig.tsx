import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Plus, Trash2, GripVertical, ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateChecklistCategory,
  useCreateChecklistItem,
  useDeleteChecklistCategory,
  useDeleteChecklistItem,
  useReplicateChecklistToPackage,
  useTenantChecklist,
  useTenantPackages,
  useUpdateChecklistCategory,
  useUpdateChecklistItem,
} from "@/features/configuracoes";
import { toast } from "@/hooks/use-toast";
import {
  SettingsPageHeader,
  SettingsStatChip,
} from "@/components/configuracoes/SettingsPageHeader";
import { SETTINGS_PAGE_META } from "@/pages/configuracoes/settings-page-meta";

const ChecklistConfig = ({ showSettingsHeader = false }: { showSettingsHeader?: boolean }) => {
  const { data: packages = [], isLoading: isLoadingPackages } = useTenantPackages();
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [replicateOpen, setReplicateOpen] = useState(false);
  const [targetPackageId, setTargetPackageId] = useState<string | null>(null);

  useEffect(() => {
    if (packages.length === 0) {
      setSelectedPackageId(null);
      return;
    }

    setSelectedPackageId((current) =>
      current && packages.some((pkg) => pkg.id === current) ? current : packages[0].id
    );
  }, [packages]);

  const { data: categories = [], isLoading: isLoadingChecklist } = useTenantChecklist(selectedPackageId);
  const createCategory = useCreateChecklistCategory(selectedPackageId);
  const createItem = useCreateChecklistItem(selectedPackageId);
  const updateCategory = useUpdateChecklistCategory(selectedPackageId);
  const updateItem = useUpdateChecklistItem(selectedPackageId);
  const deleteCategory = useDeleteChecklistCategory(selectedPackageId);
  const deleteItem = useDeleteChecklistItem(selectedPackageId);
  const replicateChecklist = useReplicateChecklistToPackage();

  const [expandedCats, setExpandedCats] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newItemInputs, setNewItemInputs] = useState<Record<string, string>>({});

  const selectedPackage = useMemo(
    () => packages.find((pkg) => pkg.id === selectedPackageId),
    [packages, selectedPackageId]
  );

  const replicateTargets = useMemo(
    () => packages.filter((pkg) => pkg.id !== selectedPackageId),
    [packages, selectedPackageId]
  );

  useEffect(() => {
    setExpandedCats([]);
    setNewCategoryName("");
    setNewItemInputs({});
  }, [selectedPackageId]);

  const toggleExpand = (catId: string) => {
    setExpandedCats((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const toggleCategory = async (catId: string, active: boolean) => {
    try {
      await updateCategory.mutateAsync({ active, categoryId: catId });
    } catch {
      toast({ title: "Nao foi possivel atualizar a categoria", variant: "destructive" });
    }
  };

  const toggleItem = async (itemId: string, active: boolean) => {
    try {
      await updateItem.mutateAsync({ active, itemId });
    } catch {
      toast({ title: "Nao foi possivel atualizar o item", variant: "destructive" });
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      await deleteItem.mutateAsync(itemId);
      toast({ title: "Item removido" });
    } catch {
      toast({ title: "Nao foi possivel remover o item", variant: "destructive" });
    }
  };

  const addItem = async (catId: string) => {
    const label = newItemInputs[catId]?.trim();
    if (!label) return;

    try {
      await createItem.mutateAsync({ categoryId: catId, label });
      toast({ title: "Item adicionado" });
    } catch {
      toast({ title: "Nao foi possivel adicionar o item", variant: "destructive" });
      return;
    }

    setNewItemInputs((prev) => ({ ...prev, [catId]: "" }));
  };

  const addCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      await createCategory.mutateAsync(newCategoryName.trim());
      toast({ title: "Categoria adicionada" });
    } catch {
      toast({ title: "Nao foi possivel adicionar a categoria", variant: "destructive" });
      return;
    }

    setNewCategoryName("");
  };

  const removeCategory = async (catId: string) => {
    try {
      await deleteCategory.mutateAsync(catId);
      toast({ title: "Categoria removida" });
    } catch {
      toast({ title: "Nao foi possivel remover a categoria", variant: "destructive" });
    }
  };

  const openReplicateDialog = () => {
    setTargetPackageId(replicateTargets[0]?.id ?? null);
    setReplicateOpen(true);
  };

  const handleReplicate = async () => {
    if (!selectedPackageId || !targetPackageId) return;

    try {
      await replicateChecklist.mutateAsync({
        sourcePackageId: selectedPackageId,
        targetPackageId,
      });
      toast({
        title: "Checklist replicado",
        description: `As categorias foram copiadas para ${packages.find((pkg) => pkg.id === targetPackageId)?.name ?? "o pacote selecionado"}.`,
      });
      setReplicateOpen(false);
    } catch (error) {
      const description =
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : "Nao foi possivel replicar o checklist.";
      toast({ title: "Falha ao replicar", description, variant: "destructive" });
    }
  };

  if (isLoadingPackages) {
    return <p className="text-sm text-muted-foreground">Carregando pacotes...</p>;
  }

  const categoryCount = categories.length;
  const itemCount = categories.reduce((sum, category) => sum + category.items.length, 0);
  const activeItemCount = categories.reduce(
    (sum, category) => sum + category.items.filter((item) => item.active).length,
    0,
  );

  const settingsHeader = showSettingsHeader ? (
    <SettingsPageHeader
      title={SETTINGS_PAGE_META.checklist.title}
      description={SETTINGS_PAGE_META.checklist.description}
      stats={
        packages.length > 0 ? (
          <>
            <SettingsStatChip>
              {packages.length} {packages.length === 1 ? "pacote" : "pacotes"}
            </SettingsStatChip>
            {selectedPackage && (
              <>
                <SettingsStatChip>
                  {categoryCount} {categoryCount === 1 ? "categoria" : "categorias"}
                </SettingsStatChip>
                <SettingsStatChip>
                  {activeItemCount} de {itemCount}{" "}
                  {itemCount === 1 ? "item ativo" : "itens ativos"}
                </SettingsStatChip>
              </>
            )}
          </>
        ) : null
      }
    />
  ) : null;

  if (packages.length === 0) {
    return (
      <div className="space-y-4">
        {settingsHeader}
        <div className="rounded-xl border border-dashed border-border/60 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Cadastre um pacote em{" "}
            <Link to="/configuracoes/pacotes" className="text-primary hover:underline">
              Configurações &gt; Pacotes
            </Link>{" "}
            para configurar o checklist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {settingsHeader}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2 min-w-[220px] max-w-sm">
          <label className="text-sm font-medium text-foreground" htmlFor="checklist-package">
            Pacote
          </label>
          <Select
            value={selectedPackageId ?? undefined}
            onValueChange={(value) => setSelectedPackageId(value)}
          >
            <SelectTrigger id="checklist-package">
              <SelectValue placeholder="Selecione um pacote" />
            </SelectTrigger>
            <SelectContent>
              {packages.map((pkg) => (
                <SelectItem key={pkg.id} value={pkg.id}>
                  {pkg.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          variant="outline"
          className="gap-2 shrink-0"
          disabled={!selectedPackageId || replicateTargets.length === 0}
          onClick={openReplicateDialog}
        >
          <Copy className="h-4 w-4" />
          Replicar para outro pacote
        </Button>
      </div>

      {selectedPackage && (
        <p className="text-sm text-muted-foreground">
          Editando checklist do pacote <span className="font-medium text-foreground">{selectedPackage.name}</span>.
        </p>
      )}

      {isLoadingChecklist && <p className="text-sm text-muted-foreground">Carregando checklist...</p>}
      {!isLoadingChecklist && categories.length === 0 && (
        <div className="rounded-xl border border-dashed border-border/60 p-8 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma categoria cadastrada para este pacote.</p>
        </div>
      )}

      {categories.map((cat) => {
        const isExpanded = expandedCats.includes(cat.id);
        const activeCount = cat.items.filter((i) => i.active).length;

        return (
          <div key={cat.id} className="glass-card overflow-hidden">
            <div className="flex items-center gap-3 p-4">
              <button
                onClick={() => toggleExpand(cat.id)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-foreground">{cat.name}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {activeCount} {activeCount === 1 ? "item" : "itens"}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={cat.active}
                  onChange={() => void toggleCategory(cat.id, !cat.active)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-foreground after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4 peer-checked:after:bg-primary-foreground" />
              </label>
              <button
                onClick={() => void removeCategory(cat.id)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {isExpanded && (
              <div className="border-t border-border/30 px-4 pb-4">
                <div className="space-y-1 mt-3">
                  {cat.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40 transition-colors group"
                    >
                      <GripVertical className="w-3.5 h-3.5 text-muted-foreground/30" />
                      <span
                        className={`text-sm flex-1 ${item.active ? "text-foreground" : "text-muted-foreground line-through"}`}
                      >
                        {item.label}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.active}
                          onChange={() => void toggleItem(item.id, !item.active)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-muted rounded-full peer peer-checked:bg-primary/70 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-foreground after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4 peer-checked:after:bg-primary-foreground" />
                      </label>
                      <button
                        onClick={() => void removeItem(item.id)}
                        className="p-1 rounded text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mt-3">
                  <Input
                    placeholder="Novo item..."
                    value={newItemInputs[cat.id] || ""}
                    onChange={(e) => setNewItemInputs((prev) => ({ ...prev, [cat.id]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void addItem(cat.id);
                    }}
                    className="text-sm h-8"
                  />
                  <Button size="sm" variant="outline" className="h-8 px-3" onClick={() => void addItem(cat.id)}>
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div className="flex gap-2">
        <Input
          placeholder="Nova categoria..."
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void addCategory();
          }}
          className="text-sm"
          disabled={!selectedPackageId}
        />
        <Button
          variant="outline"
          className="gap-2 shrink-0"
          onClick={() => void addCategory()}
          disabled={!selectedPackageId}
        >
          <Plus className="w-4 h-4" />
          Categoria
        </Button>
      </div>

      <Dialog open={replicateOpen} onOpenChange={setReplicateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replicar checklist</DialogTitle>
            <DialogDescription>
              Copia todas as categorias e itens de{" "}
              <span className="font-medium text-foreground">{selectedPackage?.name}</span> para outro pacote. O
              checklist do pacote de destino sera substituido.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="replicate-target-package">
              Pacote de destino
            </label>
            <Select
              value={targetPackageId ?? undefined}
              onValueChange={(value) => setTargetPackageId(value)}
            >
              <SelectTrigger id="replicate-target-package">
                <SelectValue placeholder="Selecione o pacote de destino" />
              </SelectTrigger>
              <SelectContent>
                {replicateTargets.map((pkg) => (
                  <SelectItem key={pkg.id} value={pkg.id}>
                    {pkg.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setReplicateOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => void handleReplicate()}
              disabled={!targetPackageId || replicateChecklist.isPending}
            >
              {replicateChecklist.isPending ? "Replicando..." : "Replicar checklist"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChecklistConfig;
