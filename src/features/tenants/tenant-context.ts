import { createContext } from "react";

import { Tenant } from "./types";

export interface TenantContextValue {
  currentTenant: Tenant | null;
  currentTenantId: number | null;
  error: Error | null;
  isLoading: boolean;
  setCurrentTenantId: (tenantId: number) => void;
  tenants: Tenant[];
}

export const TenantContext = createContext<TenantContextValue | null>(null);
