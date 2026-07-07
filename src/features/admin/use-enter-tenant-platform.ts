import { useNavigate } from "react-router-dom";

import { useCurrentTenant } from "@/features/tenants";

import { setPlatformAdminViewingTenantId } from "./platform-admin-viewing";

export const useEnterTenantPlatform = () => {
  const navigate = useNavigate();
  const { currentTenantId, setCurrentTenantId } = useCurrentTenant();

  return (tenantId: number, destination = "/crm") => {
    setPlatformAdminViewingTenantId(tenantId, currentTenantId);
    setCurrentTenantId(tenantId);
    navigate(destination);
  };
};
