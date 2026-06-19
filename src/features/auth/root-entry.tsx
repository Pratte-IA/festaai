import { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import { Loader2, Sparkles } from "lucide-react";

import { ProtectedRoute } from "./protected-route";
import { useAuth } from "./use-auth";

const RootLoading = () => (
  <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-black via-primary/30 to-rosa/30 px-4">
    <div className="glass-card flex max-w-md flex-col items-center gap-4 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-rosa to-lilas">
        <Sparkles className="h-6 w-6 text-white" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">Carregando FestaAI</p>
        <p className="mt-1 text-sm text-muted-foreground">Validando sua sessao...</p>
      </div>
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
    </div>
  </main>
);

export const RootEntry = ({ children }: PropsWithChildren) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <RootLoading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/contratar" replace />;
  }

  return <ProtectedRoute>{children}</ProtectedRoute>;
};
