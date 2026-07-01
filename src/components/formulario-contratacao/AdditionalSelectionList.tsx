import { useEffect, useState } from "react";

import {
  additionalBillingTypeLabels,
  additionalCategoryLabels,
  buildAdditionalQuantityLabel,
  supportsAdditionalQuantitySelection,
  type Additional,
} from "@/data/packagesData";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

interface AdditionalQuantityInputProps {
  label: string;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
}

const AdditionalQuantityInput = ({
  label,
  quantity,
  onQuantityChange,
}: AdditionalQuantityInputProps) => {
  const [draft, setDraft] = useState(String(quantity));

  useEffect(() => {
    setDraft(String(quantity));
  }, [quantity]);

  const commitQuantity = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    const next = digits ? Math.max(1, Number(digits)) : 1;
    setDraft(String(next));
    onQuantityChange(next);
  };

  return (
    <div className="pl-7">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={draft}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, "");
          setDraft(digits);
          if (digits) onQuantityChange(Math.max(1, Number(digits)));
        }}
        onBlur={() => commitQuantity(draft)}
        className="mt-1 max-w-[120px] text-sm"
      />
    </div>
  );
};

interface AdditionalSelectionListProps {
  items: Additional[];
  onQuantityChange: (additionalId: string, quantity: number) => void;
  onToggle: (additionalId: string) => void;
  selections: Map<string, number>;
}

export const AdditionalSelectionList = ({
  items,
  onQuantityChange,
  onToggle,
  selections,
}: AdditionalSelectionListProps) => (
  <div className="space-y-2">
    {items.map((item) => {
      const isSelected = selections.has(item.id);
      const quantity = selections.get(item.id) ?? 1;
      const showQuantity = isSelected && supportsAdditionalQuantitySelection(item);

      return (
        <div
          key={item.id}
          className={cn(
            "rounded-xl border p-3 space-y-2",
            isSelected ? "border-primary bg-primary/5" : "border-border/60 bg-background/50",
          )}
        >
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggle(item.id)}
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{item.name}</p>
              {item.description && (
                <p className="text-xs text-muted-foreground">{item.description}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {additionalCategoryLabels[item.category]} ·{" "}
                {additionalBillingTypeLabels[item.type]} · {formatCurrency(item.price)}
                {showQuantity && quantity > 1 && (
                  <span className="text-foreground">
                    {" "}
                    · Total: {formatCurrency(item.price * quantity)}
                  </span>
                )}
              </p>
            </div>
          </label>
          {showQuantity && (
            <AdditionalQuantityInput
              label={buildAdditionalQuantityLabel(item)}
              quantity={quantity}
              onQuantityChange={(next) => onQuantityChange(item.id, next)}
            />
          )}
        </div>
      );
    })}
  </div>
);
