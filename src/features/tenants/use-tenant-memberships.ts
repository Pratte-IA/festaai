import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
import { supabase } from "@/lib/supabase/client";

export const tenantMembershipsQueryKey = (userId: string | undefined) =>
  ["tenant-memberships", userId] as const;

const fetchTenantMembershipIds = async (userId: string): Promise<number[]> => {
  const { data, error } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => row.tenant_id);
};

export const useTenantMembershipIds = () => {
  const { isAuthenticated, user } = useAuth();

  return useQuery({
    enabled: isAuthenticated && Boolean(user?.id),
    queryFn: () => fetchTenantMembershipIds(user!.id),
    queryKey: tenantMembershipsQueryKey(user?.id),
    staleTime: 1000 * 60,
  });
};
