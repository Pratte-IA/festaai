import { useQuery } from "@tanstack/react-query";

import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

import { eventosQueryKeys } from "./query-keys";
import type { EventoContractSignatureFollowupSummary } from "./contract-signature-followup";
import { Evento, FunnelType } from "./types";

interface UseEventosOptions {
  funnel?: FunnelType;
}

type PendingContractFollowupRow = {
  assinatura_followup_inicial_enviado_em: string | null;
  assinatura_followup_lembrete_count: number | null;
  assinatura_followup_status: string | null;
  assinatura_followup_ultimo_enviado_em: string | null;
  evento_id: number;
  generated_at: string;
};

const mapContractFollowupSummary = (
  row: PendingContractFollowupRow,
): EventoContractSignatureFollowupSummary => ({
  assinatura_followup_inicial_enviado_em: row.assinatura_followup_inicial_enviado_em,
  assinatura_followup_lembrete_count: row.assinatura_followup_lembrete_count ?? 0,
  assinatura_followup_ultimo_enviado_em: row.assinatura_followup_ultimo_enviado_em,
  generated_at: row.generated_at,
});

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

  const eventos = data ?? [];
  if (funnel !== "vendas" || eventos.length === 0) {
    return eventos;
  }

  const eventoIds = eventos.map((evento) => evento.id);
  const { data: contracts, error: contractsError } = await supabase
    .from("evento_contracts")
    .select(
      "evento_id, generated_at, assinatura_followup_inicial_enviado_em, assinatura_followup_ultimo_enviado_em, assinatura_followup_lembrete_count, assinatura_followup_status",
    )
    .eq("tenant_id", tenantId)
    .eq("status", "generated")
    .eq("assinatura_followup_status", "ativo")
    .in("evento_id", eventoIds)
    .returns<PendingContractFollowupRow[]>();

  if (contractsError) {
    throw contractsError;
  }

  const contractByEventoId = new Map(
    (contracts ?? []).map((contract) => [contract.evento_id, contract]),
  );

  return eventos.map((evento) => {
    const contract = contractByEventoId.get(evento.id);
    if (!contract) return evento;

    return {
      ...evento,
      contract_signature_followup: mapContractFollowupSummary(contract),
    };
  });
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
