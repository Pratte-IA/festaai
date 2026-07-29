import { getEventoEntradaReferenceDate } from "@/features/eventos/event-financial";
import { useQuery } from "@tanstack/react-query";

import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

import { FinanceiroContratoEntrada } from "./display-types";
import { shouldIncludeLegadoValorEntrada } from "./fluxo-caixa";
import { financeiroQueryKeys } from "./query-keys";

interface EventoEntradaRow {
  cliente_nome: string;
  created_at: string;
  fechamento_confirmado_em: string | null;
  id: number;
  valor_entrada: number;
}

export interface FinanceiroContratoEntradasResult {
  entradas: FinanceiroContratoEntrada[];
  /** Mapa completo do tenant (sem filtro de mês) para deduplicação com ledger. */
  valorEntradaByEvento: Record<string, number>;
}

const isDateInRange = (isoDate: string, from: string, to: string) => isoDate >= from && isoDate <= to;

/**
 * Sinais legados (`eventos.valor_entrada`) para o Fluxo de Caixa.
 *
 * - Sempre marca `isLegacyEstimate: true` (data estimada, não comprovação de caixa).
 * - Não filtra por funil/status: histórico financeiro preserva cancelados.
 * - Parcelas detalhadas vêm do ledger (sync de evento_pagamentos).
 */
const fetchFinanceiroContratoEntradasLegadas = async (
  tenantId: number,
  from: string,
  to: string,
): Promise<FinanceiroContratoEntradasResult> => {
  const { data, error } = await supabase
    .from("eventos")
    .select("id, cliente_nome, valor_entrada, fechamento_confirmado_em, created_at")
    .eq("tenant_id", tenantId)
    .gt("valor_entrada", 0)
    .returns<EventoEntradaRow[]>();

  if (error) {
    throw error;
  }

  const rows = data ?? [];
  const valorEntradaByEvento: Record<string, number> = {};

  for (const row of rows) {
    if (shouldIncludeLegadoValorEntrada(row.valor_entrada)) {
      valorEntradaByEvento[String(row.id)] = Number(row.valor_entrada ?? 0);
    }
  }

  const entradas = rows
    .filter((row) => shouldIncludeLegadoValorEntrada(row.valor_entrada))
    .map((row) => {
      const estimatedDate = getEventoEntradaReferenceDate(row);
      return {
        clienteNome: row.cliente_nome || "Cliente",
        contractId: null,
        estimatedDate: true,
        eventoId: row.id,
        id: row.id,
        isLegacyEstimate: true,
        referenceAt: estimatedDate,
        valorEntrada: Number(row.valor_entrada ?? 0),
      } satisfies FinanceiroContratoEntrada;
    })
    .filter((item) => item.valorEntrada > 0 && isDateInRange(item.referenceAt, from, to))
    .sort((a, b) => b.referenceAt.localeCompare(a.referenceAt) || b.eventoId - a.eventoId);

  return { entradas, valorEntradaByEvento };
};

export const useFinanceiroContratoEntradas = (from: string, to: string) => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(currentTenantId && from && to),
    queryFn: () => fetchFinanceiroContratoEntradasLegadas(currentTenantId as number, from, to),
    queryKey: financeiroQueryKeys.contratoEntradas(currentTenantId, from, to),
    staleTime: 1000 * 30,
  });
};

export const toValorEntradaMap = (record: Record<string, number> | undefined): Map<number, number> => {
  const map = new Map<number, number>();
  if (!record) {
    return map;
  }

  for (const [key, value] of Object.entries(record)) {
    map.set(Number(key), value);
  }

  return map;
};
