import * as React from "react";

import { cn } from "@/lib/utils";
import { centsToReais, coerceReais, digitsToCents, formatReaisAsBrl } from "@/lib/currency-input";

export interface CurrencyInputProps
  extends Omit<React.ComponentProps<"input">, "value" | "onChange" | "type"> {
  value: number;
  onChange: (value: number) => void;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, className, placeholder = "0,00", ...props }, ref) => {
    const safeValue = coerceReais(value);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const cents = digitsToCents(event.target.value);
      onChange(centsToReais(cents));
    };

    const displayValue = safeValue > 0 ? formatReaisAsBrl(safeValue) : "";

    return (
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(className)}
        {...props}
      />
    );
  },
);

CurrencyInput.displayName = "CurrencyInput";
