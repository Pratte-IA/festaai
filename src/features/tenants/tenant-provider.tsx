import { PropsWithChildren, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { getPlatformAdminViewingTenantId } from "@/features/admin/platform-admin-viewing";
import { useAuth } from "@/features/auth";

import { TenantContext } from "./tenant-context";
import { fetchTenantById, tenantByIdQueryKey } from "./fetch-tenant-by-id";
import { Tenant } from "./types";
import { useTenantMembershipIds } from "./use-tenant-memberships";
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

const resolveCurrentTenantId = (
  tenants: Tenant[],
  selectedTenantId: number | null,
  platformAdminViewingTenantId: number | null,
) => {
  if (platformAdminViewingTenantId != null) {
    return platformAdminViewingTenantId;
  }

  if (tenants.length === 0) {
    return null;
  }

  if (tenants.length === 1) {
    return tenants[0].id;
  }

  const storedTenantId = selectedTenantId ?? getStoredTenantId();
  const hasStoredTenant =
    storedTenantId != null && tenants.some((tenant) => tenant.id === storedTenantId);

  return hasStoredTenant ? storedTenantId : tenants[0].id;
};

export const TenantProvider = ({ children }: PropsWithChildren) => {
  const { isAuthenticated, isPlatformAdmin } = useAuth();
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(() => getStoredTenantId());
  const { data: tenants = [], error, isLoading: isTenantsLoading } = useTenants();
  const { data: memberTenantIds = [], isLoading: isMembershipsLoading } = useTenantMembershipIds();

  const platformAdminViewingTenantId =
    isPlatformAdmin && isAuthenticated ? getPlatformAdminViewingTenantId() : null;

  const tenantsForResolution = useMemo(() => {
    if (platformAdminViewingTenantId != null) {
      return tenants;
    }

    if (memberTenantIds.length === 0) {
      return tenants;
    }

    const memberTenants = tenants.filter((tenant) => memberTenantIds.includes(tenant.id));
    return memberTenants.length > 0 ? memberTenants : tenants;
  }, [memberTenantIds, platformAdminViewingTenantId, tenants]);

  const currentTenantId = useMemo(
    () => resolveCurrentTenantId(tenantsForResolution, selectedTenantId, platformAdminViewingTenantId),
    [platformAdminViewingTenantId, selectedTenantId, tenantsForResolution],
  );

  const isViewingTenantMissingFromList =
    platformAdminViewingTenantId != null &&
    !tenants.some((tenant) => tenant.id === platformAdminViewingTenantId);

  const { data: platformAdminViewingTenant } = useQuery({
    enabled: isViewingTenantMissingFromList,
    queryFn: () => fetchTenantById(platformAdminViewingTenantId as number),
    queryKey: tenantByIdQueryKey(platformAdminViewingTenantId as number),
    staleTime: 1000 * 60,
  });

  const currentTenant = useMemo(() => {
    if (currentTenantId == null) {
      return null;
    }

    const tenantFromList = tenants.find((tenant) => tenant.id === currentTenantId);
    if (tenantFromList) {
      return tenantFromList;
    }

    if (platformAdminViewingTenant?.id === currentTenantId) {
      return platformAdminViewingTenant;
    }

    return null;
  }, [currentTenantId, platformAdminViewingTenant, tenants]);

  useEffect(() => {
    if (!isAuthenticated) {
      setSelectedTenantId(null);
      storeTenantId(null);
      return;
    }

    if (platformAdminViewingTenantId != null && selectedTenantId !== platformAdminViewingTenantId) {
      setSelectedTenantId(platformAdminViewingTenantId);
    }
  }, [isAuthenticated, platformAdminViewingTenantId, selectedTenantId]);

  useEffect(() => {
    if (!isAuthenticated) {
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
        isLoading: isTenantsLoading || isMembershipsLoading || (isViewingTenantMissingFromList && !platformAdminViewingTenant),
        setCurrentTenantId,
        tenants,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};
