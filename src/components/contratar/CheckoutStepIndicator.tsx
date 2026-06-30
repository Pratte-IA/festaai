import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

const steps = [
  { id: 1, label: "Implementação" },
  { id: 2, label: "Cadastro" },
  { id: 3, label: "Mensalidade" },
] as const;

interface CheckoutStepIndicatorProps {
  activeStep: 1 | 2 | 3 | 4;
  className?: string;
}

export const CheckoutStepIndicator = ({ activeStep, className }: CheckoutStepIndicatorProps) => {
  const currentStep = activeStep >= 4 ? 3 : activeStep;

  return (
    <nav aria-label="Progresso do pagamento" className={cn("w-full", className)}>
      <ol className="flex items-center gap-2 sm:gap-4">
        {steps.map((step, index) => {
          const isComplete = currentStep > step.id || activeStep >= 4;
          const isActive = currentStep === step.id && activeStep < 4;

          return (
            <li key={step.id} className="flex flex-1 items-center gap-2 sm:gap-3">
              <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                    isComplete && "border-emerald-500/50 bg-emerald-500/15 text-emerald-300",
                    isActive && "border-[#5158e7] bg-[#5158e7]/20 text-[#8b9dff]",
                    !isComplete && !isActive && "border-white/15 bg-white/[0.03] text-zinc-500",
                  )}
                >
                  {isComplete ? <Check className="h-4 w-4" aria-hidden /> : step.id}
                </div>
                <span
                  className={cn(
                    "text-center text-xs font-medium sm:text-sm",
                    isActive || isComplete ? "text-white" : "text-zinc-500",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 ? (
                <div
                  aria-hidden
                  className={cn(
                    "mb-6 hidden h-px flex-1 sm:block",
                    currentStep > step.id ? "bg-emerald-500/40" : "bg-white/10",
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
