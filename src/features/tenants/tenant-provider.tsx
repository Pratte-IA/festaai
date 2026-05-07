import { PropsWithChildren, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/features/auth";

import { TenantContext } from "./tenant-context";
import { Tenant } from "./types";
import { useTenants } from "./use-tenants";

const CURRENT_TENANT_STORAGE_KEY = "festaai.currentTenantId";

const getStoredTenantId = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const storedValue = window.localStorage.getItem(CURRENT_TENANT_STORAGE_KEY);
  const tenantId = storedValue ? Number(storedValue) : null;

  return Number.isInteger(tenantId) ? tenantId : null;
};

const storeTenantId = (tenantId: number | null) => {
  if (typeof window === "undefined") {
    return;
  }

  if (!tenantId) {
    window.localStorage.removeItem(CURRENT_TENANT_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(CURRENT_TENANT_STORAGE_KEY, String(tenantId));
};

const resolveCurrentTenantId = (tenants: Tenant[], selectedTenantId: number | null) => {
  if (tenants.length === 0) {
    return null;
  }

  const storedTenantId = selectedTenantId ?? getStoredTenantId();
  const hasStoredTenant = tenants.some((tenant) => tenant.id === storedTenantId);

  return hasStoredTenant ? storedTenantId : tenants[0].id;
};

export const TenantProvider = ({ children }: PropsWithChildren) => {
  const { isAuthenticated } = useAuth();
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(() => getStoredTenantId());
  const { data: tenants = [], error, isLoading } = useTenants();

  const currentTenantId = useMemo(
    () => resolveCurrentTenantId(tenants, selectedTenantId),
    [selectedTenantId, tenants],
  );

  const currentTenant = useMemo(
    () => tenants.find((tenant) => tenant.id === currentTenantId) ?? null,
    [currentTenantId, tenants],
  );

  useEffect(() => {
    if (!isAuthenticated) {
      setSelectedTenantId(null);
      storeTenantId(null);
      return;
    }

    storeTenantId(currentTenantId);
  }, [currentTenantId, isAuthenticated]);

  const setCurrentTenantId = (tenantId: number) => {
    setSelectedTenantId(tenantId);
    storeTenantId(tenantId);
  };

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        currentTenantId,
        error,
        isLoading,
        setCurrentTenantId,
        tenants,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};
