import { useNavigate, Link } from "react-router-dom";
import { CheckCircle2, ChevronRight, Loader2 } from "lucide-react";

import AppLayout from "@/components/AppLayout";
import { GuidedSetupStepper } from "@/components/guided-setup/GuidedSetupStepper";
import {
  SettingsPageHeader,
  SettingsStatChip,
} from "@/components/configuracoes/SettingsPageHeader";
import { Button } from "@/components/ui/button";
import { GUIDED_SETUP_STEPS, useIsGuidedSetupComplete } from "@/features/guided-setup";
import { useGuidedSetup } from "@/features/guided-setup/guided-setup-provider";
import { useTenantAdminCapability } from "@/features/tenants/use-tenant-admin-capability";
import { getErrorMessage } from "@/lib/error-message";
import { SETTINGS_PAGE_META } from "@/pages/configuracoes/settings-page-meta";

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
  const activeStepMeta = GUIDED_SETUP_STEPS.find((step) => step.key === activeStep);

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
      <div className="mx-auto w-full max-w-6xl space-y-4">
        <div className="mb-3">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <Link to="/configuracoes" className="transition-colors hover:text-primary">
              Configurações
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
            <span>{SETTINGS_PAGE_META["configuracao-inicial"].breadcrumb}</span>
          </nav>
        </div>

        <SettingsPageHeader
          title={
            isComplete
              ? "Revisar configuração do espaço"
              : SETTINGS_PAGE_META["configuracao-inicial"].title
          }
          description={
            isComplete
              ? "A configuração inicial já foi concluída. Avance pelas etapas para revisar ou ajustar as definições do seu espaço."
              : "Siga as etapas uma a uma. Ao salvar, a próxima tela abre automaticamente."
          }
          renderAction={
            isComplete
              ? (className) => (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/")}
                    className={className}
                  >
                    Ir para o painel
                  </Button>
                )
              : undefined
          }
          stats={
            <>
              <SettingsStatChip>
                {completedSteps.length} de {GUIDED_SETUP_STEPS.length} etapas concluídas
              </SettingsStatChip>
              {isComplete ? (
                <SettingsStatChip>configuração completa</SettingsStatChip>
              ) : activeStepMeta ? (
                <SettingsStatChip>etapa atual: {activeStepMeta.title}</SettingsStatChip>
              ) : null}
            </>
          }
        />

        {isComplete ? (
          <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-1.5 text-xs text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            Configuração inicial concluída
          </div>
        ) : null}

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
