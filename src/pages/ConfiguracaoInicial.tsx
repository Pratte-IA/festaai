import { useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";

import AppLayout from "@/components/AppLayout";
import { GuidedSetupStepper } from "@/components/guided-setup/GuidedSetupStepper";
import { Button } from "@/components/ui/button";
import { useIsGuidedSetupComplete } from "@/features/guided-setup";
import { useGuidedSetup } from "@/features/guided-setup/guided-setup-provider";
import { useTenantAdminCapability } from "@/features/tenants/use-tenant-admin-capability";
import { getErrorMessage } from "@/lib/error-message";

const ConfiguracaoInicial = () => {
  const navigate = useNavigate();
  const { data: adminCapability, isLoading: isAdminLoading } = useTenantAdminCapability();
  const {
    activeStep,
    completedSteps,
    isComplete,
    isLoading: isProgressLoading,
    error: progressError,
  } = useIsGuidedSetupComplete();
  const { isLoading: isContextLoading } = useGuidedSetup();

  const isLoading = isAdminLoading || isProgressLoading || isContextLoading;
  const isAdmin = Boolean(adminCapability?.isTenantAdmin);

  const handleAllStepsCompleted = () => {
    navigate("/", { replace: true });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-[420px] items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Preparando configuração inicial...
        </div>
      </AppLayout>
    );
  }

  if (progressError) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-2xl rounded-xl border border-destructive/30 bg-destructive/10 p-8 text-center">
          <p className="text-lg font-semibold text-foreground">Configuração indisponível</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {getErrorMessage(
              progressError,
              "Não foi possível carregar o progresso da configuração guiada.",
            )}
          </p>
        </div>
      </AppLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-2xl rounded-xl border border-border/60 bg-card/50 p-8 text-center">
          <p className="text-lg font-semibold text-foreground">Configuração em andamento</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Apenas administradores da empresa podem concluir a configuração inicial.
          </p>
          <Button className="mt-6" variant="outline" onClick={() => navigate("/")}>
            Voltar ao painel
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <div className="space-y-3 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {isComplete ? "Configuração guiada — revisão" : "Configuração guiada"}
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {isComplete ? "Revisar configuração do espaço" : "Vamos configurar seu espaço de festa"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isComplete
              ? "A configuração inicial já foi concluída. Clique em qualquer etapa abaixo para revisar ou ajustar as definições do seu espaço."
              : "Clique em cada etapa para configurar. Ao salvar, a etapa fecha e a próxima é aberta automaticamente."}
          </p>
          {isComplete ? (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-1.5 text-xs text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                Configuração inicial concluída
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/")}>
                Ir para o painel
              </Button>
            </div>
          ) : null}
        </div>

        <GuidedSetupStepper
          activeStep={activeStep}
          completedSteps={completedSteps}
          onAllCompleted={handleAllStepsCompleted}
        />
      </div>
    </AppLayout>
  );
};

export default ConfiguracaoInicial;
