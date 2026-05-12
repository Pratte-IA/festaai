import { useState } from "react";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  useCreateChecklistCategory,
  useCreateChecklistItem,
  useDeleteChecklistCategory,
  useDeleteChecklistItem,
  useTenantChecklist,
  useUpdateChecklistCategory,
  useUpdateChecklistItem,
} from "@/features/configuracoes";
import { toast } from "@/hooks/use-toast";

const ChecklistConfig = () => {
  const { data: categories = [], isLoading } = useTenantChecklist();
  const createCategory = useCreateChecklistCategory();
  const createItem = useCreateChecklistItem();
  const updateCategory = useUpdateChecklistCategory();
  const updateItem = useUpdateChecklistItem();
  const deleteCategory = useDeleteChecklistCategory();
  const deleteItem = useDeleteChecklistItem();
  const [expandedCats, setExpandedCats] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newItemInputs, setNewItemInputs] = useState<Record<string, string>>({});

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Checklist de Organização</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure as categorias e itens que serão gerados automaticamente para cada festa
          </p>
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando checklist...</p>}
      {!isLoading && categories.length === 0 && (
        <div className="rounded-xl border border-dashed border-border/60 p-8 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma categoria cadastrada.</p>
        </div>
      )}

      {categories.map((cat) => {
        const isExpanded = expandedCats.includes(cat.id);
        const activeCount = cat.items.filter((i) => i.active).length;

        return (
          <div key={cat.id} className="glass-card overflow-hidden">
            {/* Category header */}
            <div className="flex items-center gap-3 p-4">
              <button onClick={() => toggleExpand(cat.id)} className="text-muted-foreground hover:text-foreground transition-colors">
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

            {/* Items */}
            {isExpanded && (
              <div className="border-t border-border/30 px-4 pb-4">
                <div className="space-y-1 mt-3">
                  {cat.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40 transition-colors group"
                    >
                      <GripVertical className="w-3.5 h-3.5 text-muted-foreground/30" />
                      <span className={`text-sm flex-1 ${item.active ? "text-foreground" : "text-muted-foreground line-through"}`}>
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

                {/* Add item */}
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

      {/* Add category */}
      <div className="flex gap-2">
        <Input
          placeholder="Nova categoria..."
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void addCategory();
          }}
          className="text-sm"
        />
        <Button variant="outline" className="gap-2 shrink-0" onClick={() => void addCategory()}>
          <Plus className="w-4 h-4" />
          Categoria
        </Button>
      </div>
    </div>
  );
};

export default ChecklistConfig;
