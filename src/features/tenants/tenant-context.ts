import { createContext } from "react";

import { Tenant, TenantUnit } from "./types";

export interface TenantContextValue {
  currentTenant: Tenant | null;
  currentTenantId: number | null;
  currentUnit: TenantUnit | null;
  currentUnitId: number | null;
  error: Error | null;
  includeAllUnits: boolean;
  isLoading: boolean;
  setCurrentTenantId: (tenantId: number) => void;
  setCurrentUnitId: (unitId: number) => void;
  setIncludeAllUnits: (includeAllUnits: boolean) => void;
  tenants: Tenant[];
  units: TenantUnit[];
}

export const TenantContext = createContext<TenantContextValue | null>(null);
