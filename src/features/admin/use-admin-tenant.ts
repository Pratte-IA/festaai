import { useQuery } from "@tanstack/react-query";

import type { Tenant } from "@/features/tenants/types";
import { supabase } from "@/lib/supabase/client";

export const adminTenantQueryKey = (tenantId: number) => ["admin", "tenant", tenantId] as const;

export const fetchAdminTenant = async (tenantId: number): Promise<Tenant> => {
  const { data, error } = await supabase
    .from("tenants")
    .select("id, name, slug, document, phone, email, status, created_at, updated_at")
    .eq("id", tenantId)
    .maybeSingle<Tenant>();

  if (error) throw error;
  if (!data) throw new Error("Cliente não encontrado.");

  return data;
};

export const useAdminTenant = (tenantId: number | null) =>
  useQuery({
    enabled: Boolean(tenantId),
    queryFn: () => fetchAdminTenant(tenantId as number),
    queryKey: adminTenantQueryKey(tenantId as number),
    staleTime: 1000 * 60,
  });
