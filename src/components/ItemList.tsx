import { useState } from "react";
import { ClipboardList, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { isBulkListPaste, parseListItems } from "@/lib/parse-list-items";

export interface ItemListProps {
  label: string;
  items: string[];
  suggestions: string[];
  onChange: (items: string[]) => void;
  /** Texto do placeholder do campo rápido (opcional). */
  inputPlaceholder?: string;
}

export const ItemList = ({
  label,
  items,
  suggestions,
  onChange,
  inputPlaceholder,
}: ItemListProps) => {
  const [input, setInput] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");

  const available = suggestions.filter((s) => !items.includes(s));

  const addMany = (values: string[]) => {
    const next = [...items];

    for (const value of values) {
      if (!value || next.includes(value)) continue;
      next.push(value);
    }

    if (next.length !== items.length) {
      onChange(next);
    }
  };

  const add = (val: string) => {
    const v = val.trim();
    if (!v) return;
    if (isBulkListPaste(v)) {
      addMany(parseListItems(v));
      setInput("");
      return;
    }
    if (items.includes(v)) return;
    onChange([...items, v]);
    setInput("");
  };

  const remove = (val: string) => onChange(items.filter((i) => i !== val));

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData.getData("text");
    if (!isBulkListPaste(text)) return;

    event.preventDefault();
    addMany(parseListItems(text));
    setInput("");
  };

  const applyBulk = () => {
    const parsed = parseListItems(bulkText);
    if (parsed.length === 0) return;
    addMany(parsed);
    setBulkText("");
    setBulkOpen(false);
  };

  const labelLower = label.toLowerCase();

  return (
    <div>
      <span className="text-xs font-medium text-muted-foreground block mb-2">{label}</span>

      <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
        {items.length === 0 && (
          <span className="text-xs text-muted-foreground italic">Nenhum item adicionado</span>
        )}
        {items.map((item) => (
          <span
            key={item}
            className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
          >
            {item}
            <button type="button" onClick={() => remove(item)} className="hover:text-destructive">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>

      <div className="flex gap-2 mb-1">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add(input))}
          onPaste={handlePaste}
          placeholder={
            inputPlaceholder ?? `Digite ou cole itens de ${labelLower}...`
          }
          className="input-base flex-1 text-sm"
        />
        <button
          type="button"
          onClick={() => add(input)}
          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors shrink-0"
        >
          <Plus className="w-3 h-3" /> Adicionar
        </button>
      </div>

      <p className="text-[10px] text-muted-foreground mb-2">
        Cole a lista da proposta (Ctrl+V) — um item por linha ou separados por vírgula.
      </p>

      <div className="mb-2">
        <button
          type="button"
          onClick={() => setBulkOpen((open) => !open)}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ClipboardList className="w-3.5 h-3.5" />
          {bulkOpen ? "Ocultar área de colagem" : "Colar lista completa"}
        </button>
      </div>

      {bulkOpen && (
        <div className="space-y-2 mb-3 rounded-lg border border-border/40 bg-muted/20 p-3">
          <Textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={`Cole aqui os ${labelLower} da proposta ou do cardápio do buffet...`}
            rows={6}
            className="text-sm resize-y min-h-[120px]"
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={applyBulk} disabled={!bulkText.trim()}>
              Adicionar todos ({parseListItems(bulkText).length || 0})
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setBulkText("");
                setBulkOpen(false);
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {available.length > 0 && (
        <div>
          <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wide">
            Sugestões
          </p>
          <div className="flex flex-wrap gap-1.5">
            {available.slice(0, 8).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => add(s)}
                className="text-xs bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground px-2 py-1 rounded-full transition-colors"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
