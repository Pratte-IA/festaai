import { useQuery } from "@tanstack/react-query";

import { Evento, EventoPagamento } from "@/features/eventos";
import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

const reportsQueryKeys = {
  data: (tenantId: number | null) => ["reports", tenantId, "data"] as const,
};

export interface ReportData {
  eventos: Evento[];
  pagamentos: EventoPagamento[];
  paidByEventoId: Map<number, number>;
}

const fetchReportData = async (tenantId: number): Promise<ReportData> => {
  const [eventosResult, pagamentosResult] = await Promise.all([
    supabase
      .from("eventos")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("data_evento", { ascending: false })
      .returns<Evento[]>(),
    supabase
      .from("evento_pagamentos")
      .select("*")
      .eq("tenant_id", tenantId)
      .returns<EventoPagamento[]>(),
  ]);

  if (eventosResult.error) {
    throw eventosResult.error;
  }

  if (pagamentosResult.error) {
    throw pagamentosResult.error;
  }

  const pagamentos = pagamentosResult.data ?? [];
  const paidByEventoId = new Map<number, number>();

  pagamentos.forEach((pagamento) => {
    paidByEventoId.set(
      pagamento.evento_id,
      (paidByEventoId.get(pagamento.evento_id) ?? 0) + pagamento.valor,
    );
  });

  return {
    eventos: eventosResult.data ?? [],
    paidByEventoId,
    pagamentos,
  };
};

export const useReportData = () => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(currentTenantId),
    queryFn: () => fetchReportData(currentTenantId as number),
    queryKey: reportsQueryKeys.data(currentTenantId),
    staleTime: 1000 * 30,
  });
};
