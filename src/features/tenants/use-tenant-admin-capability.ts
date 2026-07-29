import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
import { supabase } from "@/lib/supabase/client";

import { useCurrentTenant } from "./use-current-tenant";

export interface TenantAdminCapability {
  /** Owner/admin of the tenant (membership role). */
  isTenantAdmin: boolean;
  /** Tenant admin or platform admin — use for support/read of admin areas. */
  canAccessTenantAdminAreas: boolean;
  role: string | null;
}

export const tenantAdminCapabilityQueryKey = (tenantId: number | null, userId: string | undefined) =>
  ["tenant-admin-capability", tenantId, userId] as const;

export const useTenantAdminCapability = () => {
  const { isPlatformAdmin, user } = useAuth();
  const { currentTenantId, isLoading: isTenantLoading } = useCurrentTenant();

  const query = useQuery({
    enabled: Boolean(user?.id && currentTenantId != null && !isTenantLoading),
    queryFn: async (): Promise<Omit<TenantAdminCapability, "canAccessTenantAdminAreas">> => {
      const { data, error } = await supabase
        .from("tenant_members")
        .select("role")
        .eq("tenant_id", currentTenantId as number)
        .eq("user_id", user?.id as string)
        .eq("status", "active")
        .maybeSingle();

      if (error) {
        throw error;
      }

      const role = data?.role;
      const isTenantAdmin = role === "owner" || role === "admin";

      return { isTenantAdmin, role: role ?? null };
    },
    queryKey: tenantAdminCapabilityQueryKey(currentTenantId, user?.id),
    staleTime: 1000 * 60,
  });

  const isTenantAdmin = Boolean(query.data?.isTenantAdmin);
  const data: TenantAdminCapability | undefined =
    query.data != null || isPlatformAdmin
      ? {
          isTenantAdmin,
          canAccessTenantAdminAreas: isTenantAdmin || isPlatformAdmin,
          role: query.data?.role ?? null,
        }
      : undefined;

  return { ...query, data };
};
