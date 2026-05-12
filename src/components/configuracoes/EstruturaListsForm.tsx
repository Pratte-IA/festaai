import { useState } from "react";
import type { EstruturaBlock } from "@/data/packagesData";
import { estruturaTemplates, itemSuggestions } from "@/data/packageTemplates";
import { Plus, Sparkles, X } from "lucide-react";

const TemplateSelector = ({
  label,
  options,
  onSelect,
}: {
  label: string;
  options: { key: string; label: string }[];
  onSelect: (key: string) => void;
}) => (
  <div className="bg-gradient-to-r from-primary/10 to-rosa/10 border border-primary/20 rounded-xl p-4">
    <div className="flex items-center gap-2 mb-3">
      <Sparkles className="w-4 h-4 text-primary" aria-hidden />
      <p className="text-sm font-medium text-foreground">{label}</p>
    </div>
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onSelect(opt.key)}
          className="px-3 py-1.5 rounded-lg bg-background/60 hover:bg-background border border-border text-xs font-medium text-foreground transition-colors"
        >
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

const ItemList = ({
  label,
  items,
  suggestions,
  onChange,
}: {
  label: string;
  items: string[];
  suggestions: string[];
  onChange: (items: string[]) => void;
}) => {
  const [input, setInput] = useState("");
  const available = suggestions.filter((s) => !items.includes(s));

  const add = (val: string) => {
    const v = val.trim();
    if (!v || items.includes(v)) return;
    onChange([...items, v]);
    setInput("");
  };

  const remove = (val: string) => onChange(items.filter((i) => i !== val));

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

      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add(input))}
          placeholder={`Novo item de ${label.toLowerCase()}...`}
          className="input-base flex-1 text-sm"
        />
        <button
          type="button"
          onClick={() => add(input)}
          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3 h-3" /> Adicionar
        </button>
      </div>

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

export interface EstruturaListsFormProps {
  value: EstruturaBlock;
  onChange: (next: EstruturaBlock) => void;
}

export const EstruturaListsForm = ({ value, onChange }: EstruturaListsFormProps) => {
  const applyTemplate = (key: keyof typeof estruturaTemplates) => {
    onChange({
      ...value,
      brinquedos: [...estruturaTemplates[key].brinquedos],
    });
  };

  return (
    <div className="space-y-6">
      <TemplateSelector
        label="Começar a partir de um modelo"
        options={[
          { key: "basico", label: "Básico" },
          { key: "completo", label: "Completo" },
          { key: "premium", label: "Premium" },
        ]}
        onSelect={(k) => applyTemplate(k as keyof typeof estruturaTemplates)}
      />

      <ItemList
        label="Brinquedos"
        items={value.brinquedos}
        suggestions={itemSuggestions.brinquedos}
        onChange={(v) => onChange({ ...value, brinquedos: v })}
      />
    </div>
  );
};
