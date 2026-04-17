import { useState } from "react";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronRight } from "lucide-react";
import { ChecklistCategory, ChecklistItem, defaultChecklistConfig } from "@/data/checklistConfig";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ChecklistConfig = () => {
  const [categories, setCategories] = useState<ChecklistCategory[]>(defaultChecklistConfig);
  const [expandedCats, setExpandedCats] = useState<string[]>(categories.map((c) => c.id));
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newItemInputs, setNewItemInputs] = useState<Record<string, string>>({});

  const toggleExpand = (catId: string) => {
    setExpandedCats((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const toggleCategory = (catId: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === catId ? { ...c, active: !c.active } : c))
    );
  };

  const toggleItem = (catId: string, itemId: string) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === catId
          ? { ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, active: !i.active } : i)) }
          : c
      )
    );
  };

  const removeItem = (catId: string, itemId: string) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === catId ? { ...c, items: c.items.filter((i) => i.id !== itemId) } : c
      )
    );
  };

  const addItem = (catId: string) => {
    const label = newItemInputs[catId]?.trim();
    if (!label) return;
    const newItem: ChecklistItem = {
      id: `${catId}-${Date.now()}`,
      label,
      active: true,
    };
    setCategories((prev) =>
      prev.map((c) => (c.id === catId ? { ...c, items: [...c.items, newItem] } : c))
    );
    setNewItemInputs((prev) => ({ ...prev, [catId]: "" }));
  };

  const addCategory = () => {
    if (!newCategoryName.trim()) return;
    const id = `cat-${Date.now()}`;
    setCategories((prev) => [
      ...prev,
      { id, name: newCategoryName.trim(), active: true, items: [] },
    ]);
    setExpandedCats((prev) => [...prev, id]);
    setNewCategoryName("");
  };

  const removeCategory = (catId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== catId));
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
                  onChange={() => toggleCategory(cat.id)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-foreground after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4 peer-checked:after:bg-primary-foreground" />
              </label>
              <button
                onClick={() => removeCategory(cat.id)}
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
                          onChange={() => toggleItem(cat.id, item.id)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-muted rounded-full peer peer-checked:bg-primary/70 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-foreground after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4 peer-checked:after:bg-primary-foreground" />
                      </label>
                      <button
                        onClick={() => removeItem(cat.id, item.id)}
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
                    onKeyDown={(e) => e.key === "Enter" && addItem(cat.id)}
                    className="text-sm h-8"
                  />
                  <Button size="sm" variant="outline" className="h-8 px-3" onClick={() => addItem(cat.id)}>
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
          onKeyDown={(e) => e.key === "Enter" && addCategory()}
          className="text-sm"
        />
        <Button variant="outline" className="gap-2 shrink-0" onClick={addCategory}>
          <Plus className="w-4 h-4" />
          Categoria
        </Button>
      </div>
    </div>
  );
};

export default ChecklistConfig;
