import { supabase } from "@/lib/supabase/client";

import type { CheckTenantHolidayResult } from "@/features/configuracoes/holiday-types";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const normalizeHolidayDateKey = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, 10);
  return ISO_DATE.test(trimmed) ? trimmed : null;
};

type CheckRpcRow = {
  date: string;
  holiday_kind: string | null;
  holiday_name: string | null;
  holiday_scope: string | null;
  holiday_source: string | null;
  is_holiday: boolean;
};

/** Consulta batch na RPC canônica de feriados (automático + tenant). */
export const checkTenantHolidays = async (
  tenantId: number,
  dates: string[],
): Promise<CheckTenantHolidayResult[]> => {
  const uniqueDates = [
    ...new Set(
      dates
        .map((date) => normalizeHolidayDateKey(date))
        .filter((date): date is string => Boolean(date)),
    ),
  ].sort();

  if (uniqueDates.length === 0) return [];

  const { data, error } = await supabase.rpc("check_tenant_holidays", {
    p_dates: uniqueDates,
    p_tenant_id: tenantId,
  });

  if (error) throw error;

  const rows = (data ?? []) as CheckRpcRow[];
  const byDate = new Map(rows.map((row) => [normalizeHolidayDateKey(row.date) ?? "", row]));

  for (const date of uniqueDates) {
    if (!byDate.has(date)) {
      throw new Error(`A RPC check_tenant_holidays não retornou a data ${date}.`);
    }
  }

  return uniqueDates.map((date) => {
    const row = byDate.get(date)!;
    return {
      date,
      holidayKind: (row.holiday_kind as CheckTenantHolidayResult["holidayKind"]) ?? null,
      holidayName: row.holiday_name,
      holidayScope: (row.holiday_scope as CheckTenantHolidayResult["holidayScope"]) ?? null,
      holidaySource: (row.holiday_source as CheckTenantHolidayResult["holidaySource"]) ?? null,
      isHoliday: Boolean(row.is_holiday),
    };
  });
};

export const buildHolidayLookup = (
  results: CheckTenantHolidayResult[],
): {
  getResult: (date: string) => CheckTenantHolidayResult | undefined;
  isHoliday: (date: string) => boolean;
} => {
  const map = new Map(results.map((row) => [row.date, row]));
  return {
    getResult: (date) => {
      const key = normalizeHolidayDateKey(date);
      return key ? map.get(key) : undefined;
    },
    isHoliday: (date) => {
      const key = normalizeHolidayDateKey(date);
      return key ? Boolean(map.get(key)?.isHoliday) : false;
    },
  };
};
