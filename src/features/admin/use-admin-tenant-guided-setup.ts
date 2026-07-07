import { useQuery } from "@tanstack/react-query";

import { deriveGuidedSetupState } from "@/features/guided-setup/derive-guided-setup-state";

export const adminTenantGuidedSetupQueryKey = (tenantId: number) =>
  ["admin", "tenant-guided-setup", tenantId] as const;

export const useAdminTenantGuidedSetup = (tenantId: number | null) =>
  useQuery({
    enabled: Boolean(tenantId),
    queryFn: () => deriveGuidedSetupState(tenantId as number),
    queryKey: adminTenantGuidedSetupQueryKey(tenantId as number),
    staleTime: 1000 * 30,
  });
