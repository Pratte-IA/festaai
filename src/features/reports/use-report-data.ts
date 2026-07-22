import { useQuery } from "@tanstack/react-query";

import type { SignedContractClosing } from "@/features/dashboard/commercial-activity";
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
  signedContracts: SignedContractClosing[];
}

const fetchReportData = async (tenantId: number): Promise<ReportData> => {
  const [eventosResult, pagamentosResult, acceptedContractsResult] = await Promise.all([
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
    supabase
      .from("evento_contracts")
      .select("evento_id, accepted_at")
      .eq("tenant_id", tenantId)
      .eq("status", "accepted")
      .not("accepted_at", "is", null),
  ]);

  if (eventosResult.error) {
    throw eventosResult.error;
  }

  if (pagamentosResult.error) {
    throw pagamentosResult.error;
  }

  if (acceptedContractsResult.error) {
    throw acceptedContractsResult.error;
  }

  const pagamentos = pagamentosResult.data ?? [];
  const paidByEventoId = new Map<number, number>();

  pagamentos.forEach((pagamento) => {
    paidByEventoId.set(
      pagamento.evento_id,
      (paidByEventoId.get(pagamento.evento_id) ?? 0) + pagamento.valor,
    );
  });

  const signedContracts = (acceptedContractsResult.data ?? []).filter(
    (contract): contract is SignedContractClosing => Boolean(contract.accepted_at),
  );

  return {
    eventos: eventosResult.data ?? [],
    paidByEventoId,
    pagamentos,
    signedContracts,
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
