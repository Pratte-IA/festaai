import * as React from "react";

import { applyBrazilMobilePhoneMask } from "@/lib/phone";
import { cn } from "@/lib/utils";

export interface PhoneInputProps
  extends Omit<React.ComponentProps<"input">, "value" | "onChange" | "type"> {
  value: string;
  onChange: (value: string) => void;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, className, placeholder = "(45) 99999-9999", ...props }, ref) => {
    // Apenas mascara — sem normalizar legado durante a digitação.
    const displayValue = applyBrazilMobilePhoneMask(value);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(applyBrazilMobilePhoneMask(event.target.value));
    };

    return (
      <input
        ref={ref}
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(className)}
        {...props}
      />
    );
  },
);

PhoneInput.displayName = "PhoneInput";
