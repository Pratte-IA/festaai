import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase/client";

import type { TenantUnit, TenantUnitKind, TenantUnitStatus } from "./types";

export const tenantUnitsQueryKey = (tenantId: number | null) => ["tenant-units", tenantId] as const;

const isUnitKind = (value: string): value is TenantUnitKind => value === "matriz" || value === "filial";

const isUnitStatus = (value: string): value is TenantUnitStatus => value === "active" || value === "inactive";

export const fetchTenantUnits = async (tenantId: number): Promise<TenantUnit[]> => {
  const { data, error } = await supabase
    .from("tenant_units")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("name", { ascending: true });

  if (error) throw error;

  return (data ?? [])
    .filter((row) => isUnitKind(row.kind) && isUnitStatus(row.status))
    .map((row) => ({
      ...row,
      kind: row.kind as TenantUnitKind,
      status: row.status as TenantUnitStatus,
    }))
    .sort((left, right) => {
      if (left.kind !== right.kind) return left.kind === "matriz" ? -1 : 1;
      return left.name.localeCompare(right.name, "pt-BR");
    });
};

export const useTenantUnits = (tenantId: number | null) =>
  useQuery({
    enabled: tenantId != null,
    queryFn: () => fetchTenantUnits(tenantId as number),
    queryKey: tenantUnitsQueryKey(tenantId),
    staleTime: 1000 * 30,
  });
