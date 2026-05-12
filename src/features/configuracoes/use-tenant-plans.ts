import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";
import { CommercialPlan } from "@/data/plansData";

import { configuracoesQueryKeys } from "./query-keys";

type PlanInput = Omit<CommercialPlan, "id">;

const mapPlanRow = (row: {
  ativo: boolean;
  fidelidade_meses: number | null;
  id: number;
  mensalidade_valor: number;
  nome: string;
  setup_parcelas: number | null;
  setup_tipo: string;
  setup_valor: number;
}): CommercialPlan => ({
  ativo: row.ativo,
  fidelidadeMeses: row.fidelidade_meses,
  id: String(row.id),
  mensalidadeValor: row.mensalidade_valor,
  nome: row.nome,
  setupParcelas: row.setup_parcelas,
  setupTipo: row.setup_tipo as CommercialPlan["setupTipo"],
  setupValor: row.setup_valor,
});

export const useTenantPlans = () => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(currentTenantId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenant_commercial_plans")
        .select("*")
        .eq("tenant_id", currentTenantId as number)
        .order("created_at", { ascending: true });

      if (error) throw error;

      return (data ?? []).map(mapPlanRow);
    },
    queryKey: configuracoesQueryKeys.plans(currentTenantId),
  });
};

export const useSaveTenantPlan = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, values }: { id?: string | null; values: PlanInput }) => {
      if (!currentTenantId || !user) throw new Error("Sessao ou tenant atual indisponivel.");

      const payload = {
        ativo: values.ativo,
        fidelidade_meses: values.fidelidadeMeses ?? null,
        mensalidade_valor: values.mensalidadeValor,
        nome: values.nome,
        setup_parcelas: values.setupTipo === "parcelado" ? values.setupParcelas ?? 1 : null,
        setup_tipo: values.setupTipo,
        setup_valor: values.setupValor,
        tenant_id: currentTenantId,
        updated_by: user.id,
      };

      const result = id
        ? await supabase
            .from("tenant_commercial_plans")
            .update(payload)
            .eq("tenant_id", currentTenantId)
            .eq("id", Number(id))
        : await supabase.from("tenant_commercial_plans").insert({
            ...payload,
            created_by: user.id,
          });

      if (result.error) throw result.error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: configuracoesQueryKeys.plans(currentTenantId) });
    },
  });
};

export const useDeleteTenantPlan = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();

  return useMutation({
    mutationFn: async (planId: string) => {
      if (!currentTenantId) throw new Error("Tenant atual indisponivel.");

      const { error } = await supabase
        .from("tenant_commercial_plans")
        .delete()
        .eq("tenant_id", currentTenantId)
        .eq("id", Number(planId));

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: configuracoesQueryKeys.plans(currentTenantId) });
    },
  });
};
