import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { Evento } from "@/features/eventos";
import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

import {
  applyCompetenciaFilters,
  buildCompetenciaPeriodResult,
  CompetenciaPeriodResult,
  isEventEligibleForCompetencia,
} from "./competencia";
import { financeiroQueryKeys } from "./query-keys";
import { FinanceiroLancamento } from "./types";

interface UseFinanceiroCompetenciaOptions {
  month: string;
  search?: string;
  statusFilter?: "todos" | "Previsto" | "Realizado";
  eventoId?: number | null;
}

type CompetenciaEventoRow = Pick<
  Evento,
  | "aniversariante_nome"
  | "cliente_nome"
  | "data_evento"
  | "funil"
  | "id"
  | "pacote_nome"
  | "status_interno"
  | "valor_total"
>;

/** Sempre scoped ao tenant do contexto autenticado — nunca aceita tenant externo. */
export const fetchCompetenciaEventosForTenant = async (
  tenantId: number,
): Promise<CompetenciaEventoRow[]> => {
  const { data, error } = await supabase
    .from("eventos")
    .select(
      "id, aniversariante_nome, cliente_nome, data_evento, funil, pacote_nome, status_interno, valor_total",
    )
    .eq("tenant_id", tenantId)
    .in("funil", ["festa", "executadas"])
    .not("data_evento", "is", null)
    .returns<CompetenciaEventoRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).filter((evento) => isEventEligibleForCompetencia(evento));
};

export const fetchCompetenciaLancamentosForTenant = async (
  tenantId: number,
): Promise<FinanceiroLancamento[]> => {
  const { data, error } = await supabase
    .from("financeiro_lancamentos")
    .select("*")
    .eq("tenant_id", tenantId)
    .returns<FinanceiroLancamento[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
};

export const useFinanceiroCompetencia = ({
  month,
  search = "",
  statusFilter = "todos",
  eventoId = null,
}: UseFinanceiroCompetenciaOptions) => {
  const { currentTenantId } = useCurrentTenant();

  const query = useQuery({
    enabled: Boolean(currentTenantId) && Boolean(month),
    queryFn: async () => {
      const tenantId = currentTenantId as number;
      const [eventos, lancamentos] = await Promise.all([
        fetchCompetenciaEventosForTenant(tenantId),
        fetchCompetenciaLancamentosForTenant(tenantId),
      ]);

      return { eventos, lancamentos };
    },
    queryKey: financeiroQueryKeys.competencia(currentTenantId, month),
    staleTime: 1000 * 30,
  });

  const result: CompetenciaPeriodResult | null = useMemo(() => {
    if (!query.data) {
      return null;
    }

    const built = buildCompetenciaPeriodResult(month, query.data.eventos, query.data.lancamentos);
    return applyCompetenciaFilters(built, { eventoId, search, statusFilter });
  }, [eventoId, month, query.data, search, statusFilter]);

  return {
    data: result,
    error: query.error,
    isLoading: query.isLoading,
    refetch: query.refetch,
    tenantId: currentTenantId,
  };
};
