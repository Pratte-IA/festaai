import { useQuery } from "@tanstack/react-query";

import { getEventoEntradaReferenceDate } from "@/features/eventos/event-financial";
import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

import { FinanceiroContratoEntrada } from "./display-types";
import { financeiroQueryKeys } from "./query-keys";

interface EventoEntradaRow {
  cliente_nome: string;
  created_at: string;
  fechamento_confirmado_em: string | null;
  id: number;
  valor_entrada: number;
}

const isDateInRange = (isoDate: string, from: string, to: string) => isoDate >= from && isoDate <= to;

/**
 * Entradas de reserva/sinal das festas.
 * Fonte: `eventos.valor_entrada` (mesma origem do financeiro da festa),
 * com data de referencia = fechamento_confirmado_em ?? created_at.
 * Nao depende de assinatura digital do contrato — a maioria das festas
 * tem entrada lancada sem `evento_contract_acceptances`.
 */
const fetchFinanceiroContratoEntradas = async (
  tenantId: number,
  from: string,
  to: string,
): Promise<FinanceiroContratoEntrada[]> => {
  const { data, error } = await supabase
    .from("eventos")
    .select("id, cliente_nome, valor_entrada, fechamento_confirmado_em, created_at")
    .eq("tenant_id", tenantId)
    .gt("valor_entrada", 0)
    .returns<EventoEntradaRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((row) => {
      const referenceDate = getEventoEntradaReferenceDate(row);
      return {
        clienteNome: row.cliente_nome || "Cliente",
        contractId: null,
        eventoId: row.id,
        id: row.id,
        referenceAt: referenceDate,
        valorEntrada: Number(row.valor_entrada ?? 0),
      } satisfies FinanceiroContratoEntrada;
    })
    .filter((item) => item.valorEntrada > 0 && isDateInRange(item.referenceAt, from, to))
    .sort((a, b) => b.referenceAt.localeCompare(a.referenceAt) || b.eventoId - a.eventoId);
};

export const useFinanceiroContratoEntradas = (from: string, to: string) => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(currentTenantId && from && to),
    queryFn: () => fetchFinanceiroContratoEntradas(currentTenantId as number, from, to),
    queryKey: financeiroQueryKeys.contratoEntradas(currentTenantId, from, to),
    staleTime: 1000 * 30,
  });
};
