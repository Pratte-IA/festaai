import { useQuery } from "@tanstack/react-query";

import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

import { eventosQueryKeys } from "./query-keys";
import { Evento, FunnelType } from "./types";

interface UseEventosOptions {
  funnel?: FunnelType;
}

const fetchEventos = async (tenantId: number, funnel?: FunnelType): Promise<Evento[]> => {
  let query = supabase
    .from("eventos")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (funnel) {
    query = query.eq("funil", funnel);
  }

  const { data, error } = await query.returns<Evento[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
};

export const useEventos = ({ funnel }: UseEventosOptions = {}) => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(currentTenantId),
    queryFn: () => fetchEventos(currentTenantId as number, funnel),
    queryKey: eventosQueryKeys.list(currentTenantId, funnel),
    staleTime: 1000 * 30,
  });
};
