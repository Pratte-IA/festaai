import { useEffect, useState } from "react";
import { Check, ChevronDown, Lock } from "lucide-react";

import { AutomacoesSetupStep } from "@/components/guided-setup/AutomacoesSetupStep";
import { AdicionaisSetupStep } from "@/components/guided-setup/AdicionaisSetupStep";
import { ChecklistSetupStep } from "@/components/guided-setup/ChecklistSetupStep";
import { CompanyProfileStepForm } from "@/components/guided-setup/CompanyProfileStepForm";
import { ContratoSetupStep } from "@/components/guided-setup/ContratoSetupStep";
import { EstruturaSetupStep } from "@/components/guided-setup/EstruturaSetupStep";
import { FinanceiroSetupStep } from "@/components/guided-setup/FinanceiroSetupStep";
import { FormularioSetupStep } from "@/components/guided-setup/FormularioSetupStep";
import { PackagesSetupStep } from "@/components/guided-setup/PackagesSetupStep";
import { WhatsappSetupStep } from "@/components/guided-setup/WhatsappSetupStep";
import {
  GUIDED_SETUP_STEPS,
  getNextGuidedSetupStep,
  type GuidedSetupStepKey,
} from "@/features/guided-setup";
import { cn } from "@/lib/utils";

interface GuidedSetupStepperProps {
  activeStep: GuidedSetupStepKey | null;
  completedSteps: GuidedSetupStepKey[];
  onAllCompleted?: () => void;
}

const isStepAccessible = (
  stepKey: GuidedSetupStepKey,
  activeStep: GuidedSetupStepKey | null,
  completedSteps: GuidedSetupStepKey[],
) => completedSteps.includes(stepKey) || stepKey === activeStep || activeStep === null;

const renderStepContent = (
  stepKey: GuidedSetupStepKey,
  onCompleted: () => void,
  onAllCompleted?: () => void,
) => {
  switch (stepKey) {
    case "company_profile":
      return <CompanyProfileStepForm onCompleted={onCompleted} />;
    case "packages":
      return <PackagesSetupStep onCompleted={onCompleted} />;
    case "adicionais":
      return <AdicionaisSetupStep onCompleted={onCompleted} />;
    case "estrutura":
      return <EstruturaSetupStep onCompleted={onCompleted} />;
    case "financeiro":
      return <FinanceiroSetupStep onCompleted={onCompleted} />;
    case "checklist":
      return <ChecklistSetupStep onCompleted={onCompleted} />;
    case "contrato":
      return <ContratoSetupStep onCompleted={onCompleted} />;
    case "formulario":
      return <FormularioSetupStep onCompleted={onCompleted} />;
    case "whatsapp":
      return <WhatsappSetupStep onCompleted={onCompleted} />;
    case "automacoes":
      return <AutomacoesSetupStep onCompleted={onAllCompleted ?? onCompleted} />;
    default:
      return null;
  }
};

export const GuidedSetupStepper = ({
  activeStep,
  completedSteps,
  onAllCompleted,
}: GuidedSetupStepperProps) => {
  const [expandedStep, setExpandedStep] = useState<GuidedSetupStepKey | null>(activeStep);

  useEffect(() => {
    setExpandedStep(activeStep);
  }, [activeStep]);

  const handleStepCompleted = (completedStepKey: GuidedSetupStepKey) => {
    const mergedCompleted = Array.from(
      new Set([...completedSteps, completedStepKey]),
    ) as GuidedSetupStepKey[];
    const nextStep = getNextGuidedSetupStep(mergedCompleted);
    setExpandedStep(nextStep);
  };

  const handleHeaderClick = (stepKey: GuidedSetupStepKey) => {
    if (!isStepAccessible(stepKey, activeStep, completedSteps)) return;
    setExpandedStep((current) => (current === stepKey ? null : stepKey));
  };

  return (
    <ol className="flex w-full flex-col gap-2">
      {GUIDED_SETUP_STEPS.map((step, index) => {
        const isCompleted = completedSteps.includes(step.key);
        const isCurrent = step.key === activeStep;
        const isExpanded = expandedStep === step.key;
        const isAccessible = isStepAccessible(step.key, activeStep, completedSteps);

        return (
          <li
            key={step.key}
            className={cn(
              "w-full rounded-xl border transition-colors",
              isExpanded ? "overflow-visible" : "overflow-hidden",
              isExpanded
                ? "border-primary/40 bg-card/60 shadow-sm"
                : isCompleted
                  ? "border-emerald-500/25 bg-emerald-500/5"
                  : isCurrent
                    ? "border-primary/30 bg-primary/5"
                    : "border-border/50 bg-muted/15",
            )}
          >
            <button
              type="button"
              disabled={!isAccessible}
              aria-expanded={isExpanded}
              onClick={() => handleHeaderClick(step.key)}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors sm:gap-4 sm:px-5",
                isAccessible ? "cursor-pointer hover:bg-muted/20" : "cursor-not-allowed opacity-60",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  isCompleted
                    ? "bg-emerald-500 text-white"
                    : isCurrent
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" aria-hidden /> : index + 1}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <p className="text-sm font-semibold text-foreground sm:text-base">{step.title}</p>
                  {!isExpanded ? (
                    <p className="hidden truncate text-xs text-muted-foreground sm:inline sm:max-w-[50%]">
                      {step.description}
                    </p>
                  ) : null}
                </div>
                {isExpanded ? (
                  <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{step.description}</p>
                ) : null}
              </div>

              <span className="shrink-0 text-muted-foreground">
                {isAccessible ? (
                  <ChevronDown
                    className={cn("h-5 w-5 transition-transform duration-200", isExpanded && "rotate-180")}
                    aria-hidden
                  />
                ) : (
                  <Lock className="h-4 w-4" aria-hidden />
                )}
              </span>
            </button>

            {isExpanded ? (
              <div className="border-t border-border/40 px-4 py-6 sm:px-5">
                {renderStepContent(step.key, () => handleStepCompleted(step.key), onAllCompleted)}
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
};
