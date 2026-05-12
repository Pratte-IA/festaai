import { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ShieldAlert, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useAuth } from "./use-auth";

const AdminRouteState = ({
  description,
  title,
  variant = "loading",
}: {
  description: string;
  title: string;
  variant?: "loading" | "denied";
}) => {
  const Icon = variant === "denied" ? ShieldAlert : ShieldCheck;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-black via-primary/25 to-rosa/20 px-4">
      <div className="glass-card flex max-w-md flex-col items-center gap-4 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-rosa to-lilas">
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {variant === "denied" && (
          <Button asChild variant="outline">
            <a href="/">Voltar para o painel</a>
          </Button>
        )}
      </div>
    </main>
  );
};

export const PlatformAdminRoute = ({ children }: PropsWithChildren) => {
  const { isAuthenticated, isLoading, isPlatformAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <AdminRouteState
        description="Validando suas permissoes de administradora da plataforma..."
        title="Carregando Admin FestaAI"
      />
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!isPlatformAdmin) {
    return (
      <AdminRouteState
        description="Sua conta nao possui permissao para acessar a administracao global."
        title="Acesso negado"
        variant="denied"
      />
    );
  }

  return children;
};
