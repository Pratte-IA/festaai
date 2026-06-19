import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GUIDED_SETUP_ROUTE } from "@/features/guided-setup";
import { useGuidedSetup } from "@/features/guided-setup/guided-setup-provider";

export const GuidedSetupBanner = () => {
  const { isAdmin, isComplete, isLoading, isOnSetupRoute } = useGuidedSetup();

  if (isLoading || isOnSetupRoute) return null;

  if (isComplete) {
    if (!isAdmin) return null;

    return (
      <div className="border-b border-border/60 bg-muted/20 px-4 py-3">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="h-4 w-4" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Configuração inicial concluída</p>
              <p className="text-sm text-muted-foreground">
                Você pode revisar ou refazer qualquer etapa da configuração guiada quando quiser.
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="outline" className="shrink-0 gap-2">
            <Link to={GUIDED_SETUP_ROUTE}>
              Revisar configuração
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-primary/25 bg-primary/10 px-4 py-3">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <Sparkles className="h-4 w-4" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Configuração inicial pendente</p>
            <p className="text-sm text-muted-foreground">
              {isAdmin
                ? "Você pode navegar pela plataforma, mas precisa concluir a configuração guiada para liberar alterações."
                : "Aguarde um administrador da empresa concluir a configuração inicial para liberar alterações."}
            </p>
          </div>
        </div>
        {isAdmin ? (
          <Button asChild size="sm" className="shrink-0 gap-2">
            <Link to={GUIDED_SETUP_ROUTE}>
              Continuar configuração
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
};
