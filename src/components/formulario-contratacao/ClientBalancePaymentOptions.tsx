import { Checkbox } from "@/components/ui/checkbox";
import {
  BALANCE_PAYMENT_OPTION_LABELS,
  type BalancePaymentOption,
} from "@/features/public-contract-form/balance-payment-option";
import { cn } from "@/lib/utils";

interface ClientBalancePaymentOptionsProps {
  error?: string;
  onChange: (value: BalancePaymentOption | null) => void;
  value: BalancePaymentOption | null;
}

const OPTIONS: BalancePaymentOption[] = ["7_dias_antes", "mensal"];

export const ClientBalancePaymentOptions = ({
  error,
  onChange,
  value,
}: ClientBalancePaymentOptionsProps) => (
  <div className="space-y-2 pt-1">
    <div className="space-y-2">
      {OPTIONS.map((option) => {
        const isSelected = value === option;

        return (
          <label
            key={option}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-3 cursor-pointer",
              isSelected ? "border-primary bg-primary/5" : "border-border/60",
            )}
          >
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onChange(checked === true ? option : null)}
              className="mt-0.5"
            />
            <span className="text-sm text-foreground">{BALANCE_PAYMENT_OPTION_LABELS[option]}</span>
          </label>
        );
      })}
    </div>
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
);
