import { useContext } from "react";

import { TenantContext } from "./tenant-context";

export const useCurrentTenant = () => {
  const tenantContext = useContext(TenantContext);

  if (!tenantContext) {
    throw new Error("useCurrentTenant must be used within a TenantProvider");
  }

  return tenantContext;
};
