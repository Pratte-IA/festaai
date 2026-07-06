import { useQuery } from "@tanstack/react-query";

import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

import { FinanceiroContratoEntrada } from "./display-types";
import { financeiroQueryKeys } from "./query-keys";

interface ContratoEntradaRow {
  accepted_at: string;
  contract_id: number;
  evento_id: number;
  id: number;
  eventos: {
    cliente_nome: string;
    valor_entrada: number;
  } | null;
}

const isDateInRange = (isoTimestamp: string, from: string, to: string) => {
  const date = isoTimestamp.slice(0, 10);
  return date >= from && date <= to;
};

const fetchFinanceiroContratoEntradas = async (
  tenantId: number,
  from: string,
  to: string,
): Promise<FinanceiroContratoEntrada[]> => {
  const { data, error } = await supabase
    .from("evento_contract_acceptances")
    .select(
      `
      id,
      accepted_at,
      evento_id,
      contract_id,
      eventos (
        cliente_nome,
        valor_entrada
      )
    `,
    )
    .eq("tenant_id", tenantId)
    .gte("accepted_at", `${from}T00:00:00`)
    .lte("accepted_at", `${to}T23:59:59.999`)
    .returns<ContratoEntradaRow[]>();

  if (error) {
    throw error;
  }

  const seenEventoIds = new Set<number>();

  return (data ?? [])
    .sort((a, b) => b.accepted_at.localeCompare(a.accepted_at))
    .filter((row) => isDateInRange(row.accepted_at, from, to))
    .filter((row) => {
      if (seenEventoIds.has(row.evento_id)) {
        return false;
      }

      seenEventoIds.add(row.evento_id);
      return true;
    })
    .map((row) => ({
      acceptedAt: row.accepted_at,
      clienteNome: row.eventos?.cliente_nome ?? "Cliente",
      contractId: row.contract_id,
      eventoId: row.evento_id,
      id: row.id,
      valorEntrada: Number(row.eventos?.valor_entrada ?? 0),
    }))
    .filter((item) => item.valorEntrada > 0)
    .sort((a, b) => b.acceptedAt.localeCompare(a.acceptedAt));
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
