import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

import { financeiroQueryKeys } from "./query-keys";
import { FinanceiroLancamento } from "./types";

interface LancamentosFilters {
  eventoId?: number | null;
  from?: string;
  to?: string;
}

interface CreateFinanceiroLancamentoInput {
  categoria: string;
  data_competencia?: string | null;
  data_lancamento: string;
  descricao?: string | null;
  eventoId?: number | null;
  observacao?: string | null;
  origem: FinanceiroLancamento["origem"];
  tipo: FinanceiroLancamento["tipo"];
  valor: number;
}

const toMonthStart = (dateValue: string) => {
  const [year, month] = dateValue.slice(0, 10).split("-");
  return `${year}-${month}-01`;
};

const fetchFinanceiroLancamentos = async (
  tenantId: number,
  filters: LancamentosFilters = {},
): Promise<FinanceiroLancamento[]> => {
  let query = supabase
    .from("financeiro_lancamentos")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("data_lancamento", { ascending: false })
    .order("id", { ascending: false });

  if (filters.eventoId != null) {
    query = query.eq("evento_id", filters.eventoId);
  }

  if (filters.from) {
    query = query.gte("data_lancamento", filters.from);
  }

  if (filters.to) {
    query = query.lte("data_lancamento", filters.to);
  }

  const { data, error } = await query.returns<FinanceiroLancamento[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
};

export const useFinanceiroLancamentos = (
  filters: LancamentosFilters = {},
  options: { enabled?: boolean } = {},
) => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(currentTenantId) && (options.enabled ?? true),
    queryFn: () => fetchFinanceiroLancamentos(currentTenantId as number, filters),
    queryKey: financeiroQueryKeys.lancamentos(currentTenantId, filters),
    staleTime: 1000 * 30,
  });
};

export const useCreateFinanceiroLancamento = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateFinanceiroLancamentoInput): Promise<FinanceiroLancamento> => {
      if (!currentTenantId || !user) {
        throw new Error("Sessao ou tenant atual indisponivel.");
      }

      const dataCompetencia = input.data_competencia
        ? toMonthStart(input.data_competencia)
        : toMonthStart(input.data_lancamento);

      const { data, error } = await supabase
        .from("financeiro_lancamentos")
        .insert({
          categoria: input.categoria,
          created_by: user.id,
          data_competencia: dataCompetencia,
          data_lancamento: input.data_lancamento,
          descricao: input.descricao ?? null,
          evento_id: input.eventoId ?? null,
          observacao: input.observacao ?? null,
          origem: input.origem,
          tenant_id: currentTenantId,
          tipo: input.tipo,
          updated_by: user.id,
          valor: input.valor,
        })
        .select("*")
        .single()
        .returns<FinanceiroLancamento>();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({ queryKey: financeiroQueryKeys.all(currentTenantId) });
      if (input.eventoId) {
        void queryClient.invalidateQueries({
          queryKey: financeiroQueryKeys.eventoSummary(currentTenantId, input.eventoId),
        });
      }
    },
  });
};

export const useDeleteFinanceiroLancamento = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();

  return useMutation({
    mutationFn: async (input: { id: number; eventoId?: number | null }) => {
      if (!currentTenantId) {
        throw new Error("Tenant atual indisponivel.");
      }

      const { error } = await supabase
        .from("financeiro_lancamentos")
        .delete()
        .eq("tenant_id", currentTenantId)
        .eq("id", input.id);

      if (error) {
        throw error;
      }
    },
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({ queryKey: financeiroQueryKeys.all(currentTenantId) });
      if (input.eventoId) {
        void queryClient.invalidateQueries({
          queryKey: financeiroQueryKeys.eventoSummary(currentTenantId, input.eventoId),
        });
      }
    },
  });
};

export const invalidateFinanceiroQueries = (
  queryClient: ReturnType<typeof useQueryClient>,
  tenantId: number | null,
  eventoId?: number | null,
) => {
  void queryClient.invalidateQueries({ queryKey: financeiroQueryKeys.all(tenantId) });
  if (eventoId) {
    void queryClient.invalidateQueries({
      queryKey: financeiroQueryKeys.eventoSummary(tenantId, eventoId),
    });
  }
};
