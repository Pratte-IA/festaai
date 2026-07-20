import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

import type {
  HolidayKind,
  HolidayRecurrenceType,
  HolidayScope,
  HolidaySource,
  TenantHolidayCalendarEntry,
  TenantHolidayInput,
  TenantHolidayScope,
} from "./holiday-types";
import { configuracoesQueryKeys } from "./query-keys";

type CalendarRpcRow = {
  active: boolean;
  date: string;
  editable: boolean;
  id: number | null;
  kind: string;
  name: string;
  recurrence_type: string;
  recurs_annually: boolean;
  scope: string;
  source: string;
};

type HolidayRow = {
  active: boolean;
  holiday_date: string;
  id: number;
  kind: string;
  name: string;
  recurs_annually: boolean;
  scope: string;
};

const mapCalendarRow = (row: CalendarRpcRow): TenantHolidayCalendarEntry => ({
  active: row.active,
  date: String(row.date).slice(0, 10),
  editable: row.editable,
  id: row.id,
  kind: row.kind as HolidayKind,
  name: row.name,
  recurrenceType: row.recurrence_type as HolidayRecurrenceType,
  recursAnnually: row.recurs_annually,
  scope: row.scope as HolidayScope,
  source: row.source as HolidaySource,
});

const invalidateHolidayQueries = (
  queryClient: ReturnType<typeof useQueryClient>,
  tenantId: number | null,
  year?: number,
) => {
  void queryClient.invalidateQueries({
    queryKey: configuracoesQueryKeys.holidays(tenantId, year),
  });
  void queryClient.invalidateQueries({
    queryKey: ["configuracoes", tenantId, "holidays"],
  });
};

export const findInactiveTwinHoliday = async (
  tenantId: number,
  input: Pick<TenantHolidayInput, "holidayDate" | "kind" | "name" | "recursAnnually" | "scope">,
): Promise<HolidayRow | null> => {
  const normalizedName = input.name.trim().toLowerCase();
  let query = supabase
    .from("tenant_holidays")
    .select("id, holiday_date, name, scope, kind, recurs_annually, active")
    .eq("tenant_id", tenantId)
    .eq("active", false)
    .eq("scope", input.scope)
    .eq("kind", input.kind)
    .eq("recurs_annually", input.recursAnnually);

  if (input.recursAnnually) {
    const month = Number(input.holidayDate.slice(5, 7));
    const day = Number(input.holidayDate.slice(8, 10));
    const { data, error } = await query;
    if (error) throw error;
    const match =
      (data ?? []).find((row) => {
        const rowDate = String(row.holiday_date).slice(0, 10);
        return (
          Number(rowDate.slice(5, 7)) === month &&
          Number(rowDate.slice(8, 10)) === day &&
          row.name.trim().toLowerCase() === normalizedName
        );
      }) ?? null;
    return match as HolidayRow | null;
  }

  const { data, error } = await query.eq("holiday_date", input.holidayDate).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  if (data.name.trim().toLowerCase() !== normalizedName) return null;
  return data as HolidayRow;
};

export const useTenantHolidayCalendar = (year: number) => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(currentTenantId) && year >= 1900 && year <= 2200,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_tenant_holiday_calendar", {
        p_tenant_id: currentTenantId as number,
        p_year: year,
      });

      if (error) throw error;
      return ((data ?? []) as CalendarRpcRow[]).map(mapCalendarRow);
    },
    queryKey: configuracoesQueryKeys.holidays(currentTenantId, year),
  });
};

export const useCreateTenantHoliday = (year: number) => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();

  return useMutation({
    mutationFn: async (input: TenantHolidayInput) => {
      if (!currentTenantId) throw new Error("Tenant atual indisponível.");

      const twin = await findInactiveTwinHoliday(currentTenantId, input);
      if (twin) {
        const err = new Error(
          "Já existe um feriado idêntico inativo. Reative o registro existente.",
        ) as Error & { inactiveTwinId?: number };
        err.inactiveTwinId = twin.id;
        throw err;
      }

      const { error } = await supabase.from("tenant_holidays").insert({
        active: input.active,
        holiday_date: input.holidayDate,
        kind: input.kind,
        name: input.name.trim(),
        recurs_annually: input.recursAnnually,
        scope: input.scope,
        tenant_id: currentTenantId,
      });

      if (error) throw error;
    },
    onSuccess: () => invalidateHolidayQueries(queryClient, currentTenantId, year),
  });
};

export const useUpdateTenantHoliday = (year: number) => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: number;
      input: Partial<TenantHolidayInput>;
    }) => {
      if (!currentTenantId) throw new Error("Tenant atual indisponível.");

      const payload: {
        active?: boolean;
        holiday_date?: string;
        kind?: string;
        name?: string;
        recurs_annually?: boolean;
        scope?: string;
      } = {};
      if (input.name != null) payload.name = input.name.trim();
      if (input.holidayDate != null) payload.holiday_date = input.holidayDate;
      if (input.scope != null) payload.scope = input.scope;
      if (input.kind != null) payload.kind = input.kind;
      if (input.recursAnnually != null) payload.recurs_annually = input.recursAnnually;
      if (input.active != null) payload.active = input.active;

      const { error } = await supabase
        .from("tenant_holidays")
        .update(payload)
        .eq("id", id)
        .eq("tenant_id", currentTenantId);

      if (error) throw error;
    },
    onSuccess: () => invalidateHolidayQueries(queryClient, currentTenantId, year),
  });
};

export const useToggleTenantHolidayActive = (year: number) => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();

  return useMutation({
    mutationFn: async ({ active, id }: { active: boolean; id: number }) => {
      if (!currentTenantId) throw new Error("Tenant atual indisponível.");

      const { error } = await supabase
        .from("tenant_holidays")
        .update({ active })
        .eq("id", id)
        .eq("tenant_id", currentTenantId);

      if (error) throw error;
    },
    onSuccess: () => invalidateHolidayQueries(queryClient, currentTenantId, year),
  });
};

export const useDeleteTenantHoliday = (year: number) => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();

  return useMutation({
    mutationFn: async (id: number) => {
      if (!currentTenantId) throw new Error("Tenant atual indisponível.");

      const { error } = await supabase
        .from("tenant_holidays")
        .delete()
        .eq("id", id)
        .eq("tenant_id", currentTenantId);

      if (error) throw error;
    },
    onSuccess: () => invalidateHolidayQueries(queryClient, currentTenantId, year),
  });
};
