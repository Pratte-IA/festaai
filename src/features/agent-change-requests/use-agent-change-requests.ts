import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
import { useCurrentTenant } from "@/features/tenants";
import { Tables, TablesInsert } from "@/lib/supabase/database.types";
import { supabase } from "@/lib/supabase/client";

import {
  adminAgentChangeRequestQueryKey,
  adminAgentChangeRequestsQueryKey,
  agentChangeRequestQueryKey,
  agentChangeRequestsQueryKey,
} from "./query-keys";

export type AgentChangeRequestRow = Tables<"agent_change_requests">;

export const useTenantAgentChangeRequests = () => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: currentTenantId != null,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_change_requests")
        .select("*")
        .eq("tenant_id", currentTenantId as number)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return (data ?? []) as AgentChangeRequestRow[];
    },
    queryKey: agentChangeRequestsQueryKey(currentTenantId),
  });
};

export const useTenantAgentChangeRequest = (id: number | null) => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: id != null && currentTenantId != null,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_change_requests")
        .select("*")
        .eq("id", id as number)
        .eq("tenant_id", currentTenantId as number)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data as AgentChangeRequestRow | null;
    },
    queryKey: agentChangeRequestQueryKey(id),
  });
};

export const useCreateAgentChangeRequest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { currentTenantId } = useCurrentTenant();

  return useMutation({
    mutationFn: async (payload: Omit<TablesInsert<"agent_change_requests">, "tenant_id" | "created_by">) => {
      if (!currentTenantId || !user?.id) {
        throw new Error("Sessão ou empresa inválida");
      }

      const row: TablesInsert<"agent_change_requests"> = {
        ...payload,
        created_by: user.id,
        tenant_id: currentTenantId,
      };

      const { data, error } = await supabase.from("agent_change_requests").insert(row).select("id").single();

      if (error) {
        throw error;
      }

      return data.id as number;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: agentChangeRequestsQueryKey(currentTenantId) });
    },
  });
};

export const useDeleteAgentChangeRequest = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("agent_change_requests").delete().eq("id", id);

      if (error) {
        throw error;
      }
    },
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({ queryKey: agentChangeRequestsQueryKey(currentTenantId) });
      void queryClient.invalidateQueries({ queryKey: agentChangeRequestQueryKey(id) });
    },
  });
};

export type AdminAgentRequestFilters = {
  status: string;
  tenantId: string;
  urgency: string;
};

export const useAdminAgentChangeRequests = (filters: AdminAgentRequestFilters) =>
  useQuery({
    queryFn: async () => {
      let query = supabase
        .from("agent_change_requests")
        .select("*, tenants(name, slug)")
        .order("created_at", { ascending: false });

      if (filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      if (filters.urgency !== "all") {
        query = query.eq("urgency", filters.urgency);
      }

      if (filters.tenantId !== "all") {
        query = query.eq("tenant_id", Number(filters.tenantId));
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data ?? [];
    },
    queryKey: adminAgentChangeRequestsQueryKey(filters),
    staleTime: 1000 * 30,
  });

export type AdminAgentChangeRequestDetail = AgentChangeRequestRow & {
  agent_change_request_internal:
    | { admin_notes: string | null; updated_at: string }
    | { admin_notes: string | null; updated_at: string }[]
    | null;
  tenants: { name: string; slug: string } | null;
};

export const useAdminAgentChangeRequest = (id: number | null) =>
  useQuery({
    enabled: id != null,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_change_requests")
        .select("*, tenants(name, slug), agent_change_request_internal(admin_notes, updated_at)")
        .eq("id", id as number)
        .single();

      if (error) {
        throw error;
      }

      return data as AdminAgentChangeRequestDetail;
    },
    queryKey: adminAgentChangeRequestQueryKey(id),
  });

export const useAdminUpdateAgentChangeRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      id: number;
      patch: Partial<
        Pick<
          AgentChangeRequestRow,
          | "status"
          | "billing_status"
          | "estimated_price"
          | "reviewed_at"
          | "approved_at"
          | "completed_at"
        >
      >;
    }) => {
      const { error } = await supabase
        .from("agent_change_requests")
        .update(payload.patch)
        .eq("id", payload.id);

      if (error) {
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["admin-agent-change-requests"] });
      void queryClient.invalidateQueries({ queryKey: adminAgentChangeRequestQueryKey(variables.id) });
    },
  });
};

export const useAdminUpsertInternalNotes = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { adminNotes: string | null; requestId: number }) => {
      const { error } = await supabase.from("agent_change_request_internal").upsert(
        {
          admin_notes: payload.adminNotes,
          request_id: payload.requestId,
        },
        { onConflict: "request_id" },
      );

      if (error) {
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["admin-agent-change-requests"] });
      void queryClient.invalidateQueries({ queryKey: adminAgentChangeRequestQueryKey(variables.requestId) });
    },
  });
};
