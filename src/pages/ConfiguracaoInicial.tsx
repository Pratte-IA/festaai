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

  if (isComplete || !activeStep) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-2xl rounded-xl border border-border/60 bg-card/50 p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
            <CheckCircle2 className="h-6 w-6" aria-hidden />
          </div>
          <p className="text-lg font-semibold text-foreground">Configuração inicial concluída</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Sua empresa já está pronta para usar todas as funcionalidades do FestaAI.
          </p>
          <Button className="mt-6" onClick={() => navigate("/")}>
            Ir para o painel
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
            Configuração guiada
          </div>
          <h1 className="text-2xl font-bold text-foreground">Vamos configurar seu espaço de festa</h1>
          <p className="text-sm text-muted-foreground">
            Clique em cada etapa para configurar. Ao salvar, a etapa fecha e a próxima é aberta
            automaticamente.
          </p>
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
