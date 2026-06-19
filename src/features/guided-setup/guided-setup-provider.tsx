import { createContext, PropsWithChildren, useContext, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useTenantAdminCapability } from "@/features/tenants/use-tenant-admin-capability";

import { GUIDED_SETUP_ROUTE } from "./guided-setup-steps";
import { useIsGuidedSetupComplete } from "./use-tenant-guided-setup";

interface GuidedSetupContextValue {
  isAdmin: boolean;
  isComplete: boolean;
  isLoading: boolean;
  isOnSetupRoute: boolean;
  isReadOnlyMode: boolean;
}

const GuidedSetupContext = createContext<GuidedSetupContextValue | null>(null);

const FIRST_VISIT_STORAGE_KEY = "festaai.guidedSetupFirstVisitHandled";

export const GuidedSetupProvider = ({ children }: PropsWithChildren) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: adminCapability, isLoading: isAdminLoading } = useTenantAdminCapability();
  const { isComplete, isLoading: isProgressLoading } = useIsGuidedSetupComplete();

  const isOnSetupRoute = location.pathname.startsWith(GUIDED_SETUP_ROUTE);
  const isAdmin = Boolean(adminCapability?.isTenantAdmin);
  const isLoading = isAdminLoading || isProgressLoading;

  const isReadOnlyMode = !isLoading && !isComplete && !isOnSetupRoute;

  useEffect(() => {
    if (isLoading || isComplete || !isAdmin || isOnSetupRoute) return;

    const storageKey = `${FIRST_VISIT_STORAGE_KEY}`;
    const alreadyHandled = sessionStorage.getItem(storageKey) === "1";
    if (alreadyHandled) return;

    sessionStorage.setItem(storageKey, "1");
    navigate(GUIDED_SETUP_ROUTE, { replace: true });
  }, [isAdmin, isComplete, isLoading, isOnSetupRoute, navigate]);

  const value = useMemo(
    () => ({
      isAdmin,
      isComplete,
      isLoading,
      isOnSetupRoute,
      isReadOnlyMode,
    }),
    [isAdmin, isComplete, isLoading, isOnSetupRoute, isReadOnlyMode],
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
