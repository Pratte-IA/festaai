import { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Building2, Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { canAccessTenantApp, useCurrentTenant } from "@/features/tenants";

import { useAuth } from "./use-auth";
import { getPlatformAdminViewingTenantId } from "@/features/admin";

interface RouteStateProps {
  description: string;
  title: string;
  variant?: "loading" | "empty" | "error";
}

const RouteState = ({ description, title, variant = "loading" }: RouteStateProps) => {
  const iconClassName = variant === "error" ? "text-destructive" : "text-white";

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-black via-primary/30 to-rosa/30 px-4">
      <div className="glass-card flex max-w-md flex-col items-center gap-4 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-rosa to-lilas">
          {variant === "loading" ? (
            <Sparkles className="h-6 w-6 text-white" />
          ) : (
            <Building2 className={`h-6 w-6 ${iconClassName}`} />
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {variant === "loading" && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
        {variant === "empty" && (
          <Button asChild variant="outline">
            <a href="mailto:suporte@festaai.com.br">Falar com suporte</a>
          </Button>
        )}
      </div>
    </main>
  );
};

export const ProtectedRoute = ({ children }: PropsWithChildren) => {
  const { isAuthenticated, isLoading, isPlatformAdmin } = useAuth();
  const {
    currentTenant,
    error: tenantError,
    isLoading: isTenantLoading,
    tenants,
  } = useCurrentTenant();
  const location = useLocation();

  if (isLoading) {
    return (
      <RouteState
        description="Validando sua sessao..."
        title="Carregando FestaAI"
      />
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (isTenantLoading && !currentTenant) {
    return (
      <RouteState
        description="Carregando a empresa vinculada ao seu usuario..."
        title="Preparando sua central"
      />
    );
  }

  if (tenantError) {
    return (
      <RouteState
        description="Nao foi possivel carregar sua empresa. Tente novamente em instantes."
        title="Erro ao carregar empresa"
        variant="error"
      />
    );
  }

  if (!currentTenant && tenants.length === 0) {
    return (
      <RouteState
        description="Seu usuario ainda nao esta vinculado a uma empresa. Peça para um administrador concluir o convite ou onboarding."
        title="Nenhuma empresa vinculada"
        variant="empty"
      />
    );
  }

  const isPlatformAdminViewing =
    isPlatformAdmin && currentTenant && getPlatformAdminViewingTenantId() === currentTenant.id;

  if (currentTenant && !canAccessTenantApp(currentTenant.status) && !isPlatformAdminViewing) {
    return (
      <RouteState
        description="O acesso desta empresa esta bloqueado por status de assinatura. Entre em contato com o suporte para regularizar."
        title="Acesso temporariamente bloqueado"
        variant="error"
      />
    );
  }

  return children;
};
