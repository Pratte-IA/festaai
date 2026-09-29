import { PropsWithChildren, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getPlatformAdminViewingTenantId } from "@/features/admin/platform-admin-viewing";
import { useAuth } from "@/features/auth";
import { syncUnitRequest } from "@/lib/supabase/unit-request";

import { TenantContext } from "./tenant-context";
import { fetchTenantById, tenantByIdQueryKey } from "./fetch-tenant-by-id";
import { Tenant, TenantUnit } from "./types";
import { useTenantMembershipIds } from "./use-tenant-memberships";
import { useTenantUnits } from "./use-tenant-units";
import { useTenants } from "./use-tenants";

const CURRENT_TENANT_STORAGE_KEY = "festaai.currentTenantId";
const CURRENT_UNIT_STORAGE_KEY = "festaai.currentUnitId";

const getStoredTenantId = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const storedValue = window.localStorage.getItem(CURRENT_TENANT_STORAGE_KEY);
  const tenantId = storedValue ? Number(storedValue) : null;

  return Number.isInteger(tenantId) ? tenantId : null;
};

const getStoredUnitId = () => {
  if (typeof window === "undefined") return null;

  const storedValue = window.localStorage.getItem(CURRENT_UNIT_STORAGE_KEY);
  const unitId = storedValue ? Number(storedValue) : null;

  return Number.isInteger(unitId) ? unitId : null;
};

const storeUnitId = (unitId: number | null) => {
  if (typeof window === "undefined") return;

  if (!unitId) {
    window.localStorage.removeItem(CURRENT_UNIT_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(CURRENT_UNIT_STORAGE_KEY, String(unitId));
};

const resolveCurrentUnit = (units: TenantUnit[], selectedUnitId: number | null) => {
  const activeUnits = units.filter((unit) => unit.status === "active");
  const selected = activeUnits.find((unit) => unit.id === selectedUnitId);
  if (selected) return selected;

  return activeUnits.find((unit) => unit.kind === "matriz") ?? activeUnits[0] ?? null;
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

  const queryClient = useQueryClient();
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(() => getStoredUnitId());
  const [includeAllUnits, setIncludeAllUnits] = useState(false);
  const previousTenantIdRef = useRef<number | null>(null);
  const { data: units = [], isLoading: isUnitsLoading } = useTenantUnits(currentTenantId);

  const currentUnit = useMemo(
    () => resolveCurrentUnit(units, selectedUnitId),
    [selectedUnitId, units],
  );
  const currentUnitId = currentUnit?.id ?? null;

  syncUnitRequest({
    scope: includeAllUnits ? "all" : "one",
    unitId: currentUnitId,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      setSelectedTenantId(null);
      setSelectedUnitId(null);
      storeTenantId(null);
      storeUnitId(null);
      return;
    }

    if (platformAdminViewingTenantId != null && selectedTenantId !== platformAdminViewingTenantId) {
      setSelectedTenantId(platformAdminViewingTenantId);
    }
  }, [isAuthenticated, platformAdminViewingTenantId, selectedTenantId]);

  useEffect(() => {
    if (!isAuthenticated) return;

    storeTenantId(currentTenantId);

    if (previousTenantIdRef.current != null && previousTenantIdRef.current !== currentTenantId) {
      setSelectedUnitId(null);
      setIncludeAllUnits(false);
    }

    previousTenantIdRef.current = currentTenantId;
  }, [currentTenantId, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    storeUnitId(currentUnitId);
  }, [currentUnitId, isAuthenticated]);

  useEffect(() => {
    if (currentUnitId == null) return;

    void queryClient.removeQueries({
      predicate: (query) => {
        const root = query.queryKey[0];
        return root !== "tenants" && root !== "tenant-units" && root !== "tenant-memberships";
      },
    });
  }, [currentUnitId, includeAllUnits, queryClient]);

  const setCurrentTenantId = (tenantId: number) => {
    setSelectedTenantId(tenantId);
    storeTenantId(tenantId);
  };

  const setCurrentUnitId = (unitId: number) => {
    setSelectedUnitId(unitId);
    setIncludeAllUnits(false);
    storeUnitId(unitId);
  };

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        currentTenantId,
        currentUnit,
        currentUnitId,
        error,
        includeAllUnits,
        isLoading:
          isTenantsLoading ||
          isMembershipsLoading ||
          isUnitsLoading ||
          (isViewingTenantMissingFromList && !platformAdminViewingTenant),
        setCurrentTenantId,
        setCurrentUnitId,
        setIncludeAllUnits,
        tenants,
        units,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};
