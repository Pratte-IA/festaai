import { createContext, PropsWithChildren, useContext, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@/features/auth";
import { FIRST_ACCESS_PASSWORD_PATH, userMustSetPassword } from "@/features/auth/must-set-password";
import { getPlatformAdminViewingTenantId } from "@/features/admin";
import { useCurrentTenant } from "@/features/tenants";
import { useTenantAdminCapability } from "@/features/tenants/use-tenant-admin-capability";

import { GUIDED_SETUP_ROUTE } from "./guided-setup-steps";
import { useIsGuidedSetupComplete } from "./use-tenant-guided-setup";

interface GuidedSetupContextValue {
  hasResolvedSetupStatus: boolean;
  isAdmin: boolean;
  isComplete: boolean;
  isLoading: boolean;
  isOnSetupRoute: boolean;
  isReadOnlyMode: boolean;
}

const GuidedSetupContext = createContext<GuidedSetupContextValue | null>(null);

const FIRST_VISIT_STORAGE_KEY = "festaai.guidedSetupFirstVisitHandled";

/** Rotas públicas de auth: o link de primeiro acesso autentica antes de criar senha. */
const AUTH_FLOW_ROUTES = ["/nova-senha", "/login"] as const;

const isAuthFlowRoute = (pathname: string) =>
  AUTH_FLOW_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));

export const GuidedSetupProvider = ({ children }: PropsWithChildren) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isPlatformAdmin, user } = useAuth();
  const { currentTenantId } = useCurrentTenant();
  const { data: adminCapability, isLoading: isAdminLoading } = useTenantAdminCapability();
  const {
    data: setupStatus,
    isComplete,
    isLoading: isProgressLoading,
  } = useIsGuidedSetupComplete();

  const isOnSetupRoute = location.pathname.startsWith(GUIDED_SETUP_ROUTE);
  const isOnAuthFlowRoute = isAuthFlowRoute(location.pathname);
  const mustSetPassword = userMustSetPassword(user);
  const isAdmin = Boolean(adminCapability?.isTenantAdmin);
  const isLoading = isAdminLoading || isProgressLoading;
  const hasResolvedSetupStatus = setupStatus != null;
  const isPlatformAdminViewing =
    isPlatformAdmin &&
    currentTenantId !== null &&
    getPlatformAdminViewingTenantId() === currentTenantId;

  // Só trava a plataforma quando o progresso foi carregado e está incompleto.
  // Se o status não resolveu (tenant ausente, RLS, rede), não bloqueia ações críticas
  // como regenerar QR do WhatsApp.
  const isReadOnlyMode =
    !isLoading &&
    hasResolvedSetupStatus &&
    !isComplete &&
    !isOnSetupRoute &&
    !isOnAuthFlowRoute &&
    !mustSetPassword &&
    !isPlatformAdminViewing;

  useEffect(() => {
    if (!mustSetPassword || isOnAuthFlowRoute) return;
    navigate(FIRST_ACCESS_PASSWORD_PATH, { replace: true });
  }, [isOnAuthFlowRoute, mustSetPassword, navigate]);

  useEffect(() => {
    if (
      mustSetPassword ||
      isLoading ||
      !hasResolvedSetupStatus ||
      isComplete ||
      !isAdmin ||
      isOnSetupRoute ||
      isOnAuthFlowRoute ||
      isPlatformAdminViewing
    ) {
      return;
    }

    const storageKey = `${FIRST_VISIT_STORAGE_KEY}`;
    const alreadyHandled = sessionStorage.getItem(storageKey) === "1";
    if (alreadyHandled) return;

    sessionStorage.setItem(storageKey, "1");
    navigate(GUIDED_SETUP_ROUTE, { replace: true });
  }, [
    hasResolvedSetupStatus,
    isAdmin,
    isComplete,
    isLoading,
    isOnAuthFlowRoute,
    isOnSetupRoute,
    isPlatformAdminViewing,
    mustSetPassword,
    navigate,
  ]);

  const value = useMemo(
    () => ({
      hasResolvedSetupStatus,
      isAdmin,
      isComplete,
      isLoading,
      isOnSetupRoute,
      isReadOnlyMode,
    }),
    [hasResolvedSetupStatus, isAdmin, isComplete, isLoading, isOnSetupRoute, isReadOnlyMode],
  );

  return <GuidedSetupContext.Provider value={value}>{children}</GuidedSetupContext.Provider>;
};

export const useGuidedSetup = () => {
  const context = useContext(GuidedSetupContext);
  if (!context) {
    throw new Error("useGuidedSetup deve ser usado dentro de GuidedSetupProvider.");
  }
  return context;
};
