import { useQuery } from "@tanstack/react-query";

import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

import { eventosQueryKeys } from "./query-keys";
import { Evento } from "./types";

const fetchEvento = async (tenantId: number, eventoId: number): Promise<Evento | null> => {
  const { data, error } = await supabase
    .from("eventos")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", eventoId)
    .maybeSingle()
    .returns<Evento | null>();

  if (error) {
    throw error;
  }

  return data;
};

export const useEvento = (eventoId: number | null) => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(currentTenantId && eventoId),
    queryFn: () => fetchEvento(currentTenantId as number, eventoId as number),
    queryKey: eventosQueryKeys.detail(currentTenantId, eventoId),
    staleTime: 1000 * 30,
  });
};
