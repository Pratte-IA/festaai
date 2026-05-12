import { PropsWithChildren } from "react";
import { Link } from "react-router-dom";
import { Loader2, ShieldAlert, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useTenantAdminCapability } from "./use-tenant-admin-capability";

export const TenantAdminRoute = ({ children }: PropsWithChildren) => {
  const { data, isLoading } = useTenantAdminCapability();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-black via-primary/30 to-rosa/30 px-4">
        <div className="glass-card flex max-w-md flex-col items-center gap-4 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-rosa to-lilas">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Carregando</p>
            <p className="mt-1 text-sm text-muted-foreground">Verificando suas permissoes na empresa...</p>
          </div>
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </main>
    );
  }

  if (!data?.isTenantAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-black via-primary/30 to-rosa/30 px-4">
        <div className="glass-card flex max-w-md flex-col items-center gap-4 p-8 text-center">
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
      </main>
    );
  }

  return children;
};
