import { Link } from "react-router-dom";
import { ShieldCheck, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth";
import {
  clearPlatformAdminViewingTenantId,
  getPlatformAdminPreviousTenantId,
  getPlatformAdminViewingTenantId,
} from "@/features/admin";
import { useCurrentTenant } from "@/features/tenants";

export const PlatformAdminViewingBanner = () => {
  const { isPlatformAdmin } = useAuth();
  const { currentTenant, setCurrentTenantId, tenants } = useCurrentTenant();

  if (!isPlatformAdmin) return null;

  const viewingTenantId = getPlatformAdminViewingTenantId();
  if (!viewingTenantId || currentTenant?.id !== viewingTenantId) return null;

  const handleExit = () => {
    const previousTenantId = getPlatformAdminPreviousTenantId();
    clearPlatformAdminViewingTenantId();

    const restoreTenantId =
      previousTenantId != null && tenants.some((tenant) => tenant.id === previousTenantId)
        ? previousTenantId
        : (tenants[0]?.id ?? null);

    if (restoreTenantId != null) {
      setCurrentTenantId(restoreTenantId);
    }
  };

  return (
    <div className="border-b border-amber-200/80 bg-amber-50 px-4 py-2 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2 sm:items-center">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 sm:mt-0" />
          <p>
            Visualizando a plataforma de <strong>{currentTenant.name}</strong> como administradora da
            FestaAI. Alterações podem estar limitadas pelo perfil de leitura.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to={`/admin/tenants/${currentTenant.id}`}>Painel do cliente</Link>
          </Button>
          <Button asChild onClick={handleExit} size="sm" variant="ghost">
            <Link to="/admin">
              <X className="mr-1 h-4 w-4" />
              Sair
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};
