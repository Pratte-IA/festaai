import type { EstruturaBlock } from "@/data/packagesData";
import { estruturaTemplates, itemSuggestions } from "@/data/packageTemplates";
import { ItemList } from "@/components/ItemList";
import { Sparkles } from "lucide-react";

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
