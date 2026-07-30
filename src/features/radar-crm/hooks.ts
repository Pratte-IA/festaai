import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase/client";

import { radarCrmQueryKeys } from "./query-keys";
import type {
  AddInteractionPayload,
  RadarCompanyDetail,
  RadarCompanyListResult,
  RadarCrmFilters,
  RadarFilterOptions,
  RadarKanbanBoardResult,
  RadarKanbanFilters,
  UpdateRadarCompanyInfoPayload,
  UpsertCrmPayload,
} from "./types";

const emptyList = (filters: RadarCrmFilters): RadarCompanyListResult => ({
  total: 0,
  filtered: 0,
  page: filters.page,
  page_size: filters.pageSize,
  items: [],
});

const toOptionalBoolean = (value: boolean | null) => (value === null ? undefined : value);

const toIsoOrUndefined = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed}T00:00:00.000Z`;
  }
  return trimmed;
};

const toIsoEndOrUndefined = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed}T23:59:59.999Z`;
  }
  return trimmed;
};

export const fetchRadarCompanyList = async (
  filters: RadarCrmFilters,
): Promise<RadarCompanyListResult> => {
  const { data, error } = await supabase.rpc("radar_crm_list_companies", {
    p_search: filters.search.trim() || undefined,
    p_statuses: filters.statuses.length ? filters.statuses : undefined,
    p_priorities: filters.priorities.length ? filters.priorities : undefined,
    p_city: filters.city || undefined,
    p_state: filters.state || undefined,
    p_category: filters.category || undefined,
    p_has_instagram: toOptionalBoolean(filters.hasInstagram),
    p_has_phone: toOptionalBoolean(filters.hasPhone),
    p_has_whatsapp: toOptionalBoolean(filters.hasWhatsapp),
    p_has_website: toOptionalBoolean(filters.hasWebsite),
    p_cnpj_validated: toOptionalBoolean(filters.cnpjValidated),
    p_registration_active: toOptionalBoolean(filters.registrationActive),
    p_has_administrator: toOptionalBoolean(filters.hasAdministrator),
    p_assigned_user_id: filters.assignedUserId || undefined,
    p_next_action_from: toIsoOrUndefined(filters.nextActionFrom),
    p_next_action_to: toIsoEndOrUndefined(filters.nextActionTo),
    p_without_contact: filters.withoutContact ? true : undefined,
    p_overdue_next_action: filters.overdueNextAction ? true : undefined,
    p_page: filters.page,
    p_page_size: filters.pageSize,
  });

  if (error) throw error;
  if (!data || typeof data !== "object" || Array.isArray(data)) return emptyList(filters);
  return data as unknown as RadarCompanyListResult;
};

export const useRadarCompanyList = (filters: RadarCrmFilters) =>
  useQuery({
    queryKey: radarCrmQueryKeys.list(filters),
    queryFn: () => fetchRadarCompanyList(filters),
  });

export const useRadarFilterOptions = () =>
  useQuery({
    queryKey: radarCrmQueryKeys.filterOptions(),
    queryFn: async (): Promise<RadarFilterOptions> => {
      const { data, error } = await supabase.rpc("radar_crm_filter_options");
      if (error) throw error;
      const payload = (data ?? {}) as unknown as Partial<RadarFilterOptions>;
      return {
        cities: payload.cities ?? [],
        states: payload.states ?? [],
        categories: payload.categories ?? [],
        assignees: payload.assignees ?? [],
      };
    },
  });

export const useRadarKanbanBoard = (filters: RadarKanbanFilters) =>
  useQuery({
    queryKey: radarCrmQueryKeys.kanban(filters),
    queryFn: async (): Promise<RadarKanbanBoardResult> => {
      const { data, error } = await supabase.rpc("radar_crm_kanban_board", {
        p_search: filters.search.trim() || undefined,
        p_priorities: filters.priorities.length ? filters.priorities : undefined,
        p_city: filters.city || undefined,
        p_state: filters.state || undefined,
        p_category: filters.category || undefined,
        p_has_instagram: toOptionalBoolean(filters.hasInstagram),
        p_has_phone: toOptionalBoolean(filters.hasPhone),
        p_has_whatsapp: toOptionalBoolean(filters.hasWhatsapp),
        p_has_administrator: toOptionalBoolean(filters.hasAdministrator),
        p_assigned_user_id: filters.assignedUserId || undefined,
        p_overdue_next_action: filters.overdueNextAction ? true : undefined,
        p_next_action_today: filters.nextActionToday ? true : undefined,
        p_next_action_week: filters.nextActionWeek ? true : undefined,
        p_without_next_action: filters.withoutNextAction ? true : undefined,
        p_without_contact: filters.withoutContact ? true : undefined,
        p_do_not_contact: toOptionalBoolean(filters.doNotContact),
      });
      if (error) throw error;
      const payload = (data ?? {}) as unknown as Partial<RadarKanbanBoardResult>;
      return {
        total: payload.total ?? 0,
        filtered: payload.filtered ?? 0,
        counts: (payload.counts ?? {}) as RadarKanbanBoardResult["counts"],
        items: payload.items ?? [],
      };
    },
  });

export const useRadarCompanyDetail = (companyId: number | null) =>
  useQuery({
    enabled: companyId != null,
    queryKey: radarCrmQueryKeys.detail(companyId),
    queryFn: async (): Promise<RadarCompanyDetail> => {
      const { data, error } = await supabase.rpc("radar_crm_get_company", {
        p_company_id: companyId as number,
      });
      if (error) throw error;
      return data as unknown as RadarCompanyDetail;
    },
  });

export const useUpsertRadarCrm = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpsertCrmPayload) => {
      const { data, error } = await supabase.rpc("radar_crm_upsert_company", {
        p_company_id: payload.companyId,
        p_status: payload.status,
        p_priority: payload.priority,
        p_assigned_user_id: payload.assignedUserId ?? undefined,
        p_clear_assigned_user: payload.clearAssignedUser ?? false,
        p_next_action_at: payload.nextActionAt ?? undefined,
        p_clear_next_action: payload.clearNextAction ?? false,
        p_next_action_description: payload.nextActionDescription ?? undefined,
        p_lost_reason: payload.lostReason ?? undefined,
        p_do_not_contact: payload.doNotContact,
        p_last_contact_at: payload.lastContactAt ?? undefined,
        p_notes: payload.notes ?? undefined,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: radarCrmQueryKeys.root });
      void queryClient.invalidateQueries({
        queryKey: radarCrmQueryKeys.detail(variables.companyId),
      });
    },
  });
};

export const useUpdateRadarCompanyInfo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateRadarCompanyInfoPayload) => {
      const { data, error } = await supabase.rpc("radar_crm_update_company_info", {
        p_company_id: payload.companyId,
        p_name: payload.name,
        p_trade_name: payload.tradeName ?? "",
        p_legal_name: payload.legalName ?? "",
        p_category: payload.category ?? "",
        p_phone: payload.phone ?? "",
        p_whatsapp: payload.whatsapp ?? "",
        p_email: payload.email ?? "",
        p_city: payload.city ?? "",
        p_state: payload.state ?? "",
        p_address: payload.address ?? "",
        p_website: payload.website ?? "",
        p_instagram_url: payload.instagramUrl ?? "",
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: radarCrmQueryKeys.root });
      void queryClient.invalidateQueries({
        queryKey: radarCrmQueryKeys.detail(variables.companyId),
      });
    },
  });
};

export const useAddRadarInteraction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AddInteractionPayload) => {
      const { data, error } = await supabase.rpc("radar_crm_add_interaction", {
        p_company_id: payload.companyId,
        p_interaction_type: payload.interactionType,
        p_notes: payload.notes ?? undefined,
        p_outcome: payload.outcome ?? undefined,
        p_interaction_at: payload.interactionAt ?? undefined,
        p_status: payload.status,
        p_next_action_at: payload.nextActionAt ?? undefined,
        p_next_action_description: payload.nextActionDescription ?? undefined,
        p_clear_next_action: payload.clearNextAction ?? false,
        p_priority: payload.priority,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: radarCrmQueryKeys.root });
      void queryClient.invalidateQueries({
        queryKey: radarCrmQueryKeys.detail(variables.companyId),
      });
    },
  });
};
