import { PropsWithChildren } from "react";
import { Link } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";

import { PageContentLoader } from "@/components/PageContentLoader";
import { Button } from "@/components/ui/button";

import { useTenantAdminCapability } from "./use-tenant-admin-capability";

export const TenantAdminRoute = ({ children }: PropsWithChildren) => {
  const { data, isLoading } = useTenantAdminCapability();

  if (isLoading) {
    return <PageContentLoader />;
  }

  if (!data?.isTenantAdmin) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 rounded-xl border border-border/60 bg-card/40 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-rosa to-lilas">
          <ShieldAlert className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Acesso restrito</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Apenas administradores da empresa (owner ou admin) podem abrir solicitacoes de ajuste do agente.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/">Voltar ao painel</Link>
        </Button>
      </div>
    );
  }

  return children;
};
