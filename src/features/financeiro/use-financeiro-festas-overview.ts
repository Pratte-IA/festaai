import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { Evento } from "@/features/eventos";
import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

import { buildFinanceiroFestasOverview, isEventEligibleForCompetencia } from "./competencia";
import { financeiroQueryKeys } from "./query-keys";
import { FinanceiroLancamento } from "./types";

type FestaOverviewEvento = Pick<
  Evento,
  | "aniversariante_nome"
  | "cliente_nome"
  | "data_evento"
  | "funil"
  | "id"
  | "pacote_nome"
  | "status_interno"
  | "valor_entrada"
  | "valor_total"
>;

const fetchFestasOverviewEventos = async (tenantId: number): Promise<FestaOverviewEvento[]> => {
  const { data, error } = await supabase
    .from("eventos")
    .select(
      "id, aniversariante_nome, cliente_nome, data_evento, funil, pacote_nome, status_interno, valor_entrada, valor_total",
    )
    .eq("tenant_id", tenantId)
    .in("funil", ["festa", "executadas"])
    .returns<FestaOverviewEvento[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).filter((evento) => isEventEligibleForCompetencia(evento));
};

const fetchFestasOverviewLancamentos = async (tenantId: number): Promise<FinanceiroLancamento[]> => {
  const { data, error } = await supabase
    .from("financeiro_lancamentos")
    .select("*")
    .eq("tenant_id", tenantId)
    .not("evento_id", "is", null)
    .returns<FinanceiroLancamento[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
};

export const useFinanceiroFestasOverview = (search = "", month = "") => {
  const { currentTenantId } = useCurrentTenant();

  const query = useQuery({
    enabled: Boolean(currentTenantId),
    queryFn: async () => {
      const tenantId = currentTenantId as number;
      const [eventos, lancamentos] = await Promise.all([
        fetchFestasOverviewEventos(tenantId),
        fetchFestasOverviewLancamentos(tenantId),
      ]);

      return { eventos, lancamentos };
    },
    queryKey: financeiroQueryKeys.festasOverview(currentTenantId),
    staleTime: 1000 * 30,
  });

  const rows = useMemo(() => {
    if (!query.data) {
      return [];
    }

    let overview = buildFinanceiroFestasOverview(query.data.eventos, query.data.lancamentos, new Map());

    if (month) {
      overview = overview.filter((row) => (row.dataEvento ?? "").startsWith(month));
    }

    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return overview;
    }

    return overview.filter(
      (row) =>
        row.clienteNome.toLowerCase().includes(normalizedSearch) ||
        (row.aniversarianteNome ?? "").toLowerCase().includes(normalizedSearch) ||
        (row.pacoteNome ?? "").toLowerCase().includes(normalizedSearch),
    );
  }, [month, query.data, search]);

  return {
    data: rows,
    error: query.error,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
};
