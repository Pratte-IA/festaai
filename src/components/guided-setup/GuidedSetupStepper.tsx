import { useEffect, useState } from "react";
import { ArrowLeft, Check, ChevronRight } from "lucide-react";

import { AutomacoesSetupStep } from "@/components/guided-setup/AutomacoesSetupStep";
import { AdicionaisSetupStep } from "@/components/guided-setup/AdicionaisSetupStep";
import { ChecklistSetupStep } from "@/components/guided-setup/ChecklistSetupStep";
import { CompanyProfileStepForm } from "@/components/guided-setup/CompanyProfileStepForm";
import { ContratoSetupStep } from "@/components/guided-setup/ContratoSetupStep";
import { EstruturaSetupStep } from "@/components/guided-setup/EstruturaSetupStep";
import { FinanceiroSetupStep } from "@/components/guided-setup/FinanceiroSetupStep";
import { FeriadosSetupStep } from "@/components/guided-setup/FeriadosSetupStep";
import { FormularioSetupStep } from "@/components/guided-setup/FormularioSetupStep";
import { FollowupPropostaSetupStep } from "@/components/guided-setup/FollowupPropostaSetupStep";
import { PesquisaAvaliacaoSetupStep } from "@/components/guided-setup/PesquisaAvaliacaoSetupStep";
import { PackagesSetupStep } from "@/components/guided-setup/PackagesSetupStep";
import { WhatsappSetupStep } from "@/components/guided-setup/WhatsappSetupStep";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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

const getStepIndex = (stepKey: GuidedSetupStepKey) =>
  GUIDED_SETUP_STEPS.findIndex((step) => step.key === stepKey);

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
    case "feriados":
      return <FeriadosSetupStep onCompleted={onCompleted} />;
    case "checklist":
      return <ChecklistSetupStep onCompleted={onCompleted} />;
    case "contrato":
      return <ContratoSetupStep onCompleted={onCompleted} />;
    case "formulario":
      return <FormularioSetupStep onCompleted={onCompleted} />;
    case "followup_proposta":
      return <FollowupPropostaSetupStep onCompleted={onCompleted} />;
    case "pesquisa_avaliacao":
      return <PesquisaAvaliacaoSetupStep onCompleted={onCompleted} />;
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
  const [currentStep, setCurrentStep] = useState<GuidedSetupStepKey>(
    () => activeStep ?? GUIDED_SETUP_STEPS[0].key,
  );

  useEffect(() => {
    if (activeStep) {
      setCurrentStep(activeStep);
      return;
    }
    if (completedSteps.length === GUIDED_SETUP_STEPS.length) {
      setCurrentStep(GUIDED_SETUP_STEPS[0].key);
    }
  }, [activeStep, completedSteps.length]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  const currentIndex = getStepIndex(currentStep);
  const currentMeta = GUIDED_SETUP_STEPS[currentIndex];
  const progressPercent = Math.round(
    (completedSteps.length / GUIDED_SETUP_STEPS.length) * 100,
  );
  const previousStep = currentIndex > 0 ? GUIDED_SETUP_STEPS[currentIndex - 1] : null;
  const canGoBack =
    previousStep !== null && isStepAccessible(previousStep.key, activeStep, completedSteps);

  const handleStepCompleted = (completedStepKey: GuidedSetupStepKey) => {
    const mergedCompleted = Array.from(
      new Set([...completedSteps, completedStepKey]),
    ) as GuidedSetupStepKey[];
    const nextStep = getNextGuidedSetupStep(mergedCompleted);
    if (nextStep) {
      setCurrentStep(nextStep);
    }
  };

  const handleGoToStep = (stepKey: GuidedSetupStepKey) => {
    if (!isStepAccessible(stepKey, activeStep, completedSteps)) return;
    setCurrentStep(stepKey);
  };

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="space-y-2 rounded-xl border border-border/50 bg-card/40 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 text-sm">
          <p className="font-medium text-foreground">
            Etapa {currentIndex + 1} de {GUIDED_SETUP_STEPS.length}
          </p>
          <p className="text-muted-foreground">{progressPercent}% concluído</p>
        </div>
        <Progress value={progressPercent} className="h-2" aria-label="Progresso geral da configuração" />
      </div>

      <div className="overflow-hidden rounded-xl border border-primary/30 bg-card/60 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border/40 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  completedSteps.includes(currentStep)
                    ? "bg-emerald-500 text-white"
                    : "bg-primary text-primary-foreground",
                )}
              >
                {completedSteps.includes(currentStep) ? (
                  <Check className="h-4 w-4" aria-hidden />
                ) : (
                  currentIndex + 1
                )}
              </span>
              <h2 className="text-lg font-semibold text-foreground sm:text-xl">
                {currentMeta.title}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">{currentMeta.description}</p>
          </div>

          {canGoBack ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0 self-start"
              onClick={() => handleGoToStep(previousStep.key)}
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden />
              Etapa anterior
            </Button>
          ) : null}
        </div>

        <div className="px-4 py-6 sm:px-6">
          {renderStepContent(
            currentStep,
            () => handleStepCompleted(currentStep),
            onAllCompleted,
          )}
        </div>
      </div>

      {activeStep === null && completedSteps.length === GUIDED_SETUP_STEPS.length ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/50 bg-muted/20 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Navegue pelas etapas acima para revisar ou ajustar qualquer configuração.
          </p>
          <div className="flex flex-wrap gap-2">
            {currentIndex > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleGoToStep(GUIDED_SETUP_STEPS[currentIndex - 1].key)}
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden />
                Anterior
              </Button>
            ) : null}
            {currentIndex < GUIDED_SETUP_STEPS.length - 1 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleGoToStep(GUIDED_SETUP_STEPS[currentIndex + 1].key)}
              >
                Próxima
                <ChevronRight className="ml-1.5 h-4 w-4" aria-hidden />
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};
