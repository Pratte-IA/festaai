import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";

import { tenantTeamMembersQueryKey } from "./tenant-team-members-query-key";

export type TenantMemberWithProfile = Tables<"tenant_members"> & {
  profile: Pick<Tables<"profiles">, "cpf" | "email" | "full_name" | "id" | "phone"> | null;
};

const fetchTenantTeamMembers = async (tenantId: number): Promise<TenantMemberWithProfile[]> => {
  const { data: members, error } = await supabase
    .from("tenant_members")
    .select("id, tenant_id, user_id, role, status, invited_by, created_at, updated_at")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .returns<Tables<"tenant_members">[]>();

  if (error) {
    throw error;
  }

  const userIds = [...new Set((members ?? []).map((m) => m.user_id))];
  if (userIds.length === 0) {
    return [];
  }

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, phone, cpf, email")
    .in("id", userIds);

  if (profileError) {
    throw profileError;
  }

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (members ?? []).map((member) => ({
    ...member,
    profile: profileById.get(member.user_id) ?? null,
  }));
};

export const useTenantTeamMembers = () => {
  const { user } = useAuth();
  const { currentTenantId, isLoading: isTenantLoading } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(user?.id && currentTenantId != null && !isTenantLoading),
    queryFn: async () => fetchTenantTeamMembers(currentTenantId as number),
    queryKey: tenantTeamMembersQueryKey(currentTenantId),
    staleTime: 1000 * 30,
  });
};
