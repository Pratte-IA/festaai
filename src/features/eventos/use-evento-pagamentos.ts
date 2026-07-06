import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

import { financeiroQueryKeys } from "@/features/financeiro";

import { eventosQueryKeys } from "./query-keys";
import { EventoPagamento } from "./types";

interface CreateEventoPagamentoInput {
  data_pagamento: string;
  eventoId: number;
  observacao?: string | null;
  valor: number;
}

const fetchEventoPagamentos = async (
  tenantId: number,
  eventoId: number,
): Promise<EventoPagamento[]> => {
  const { data, error } = await supabase
    .from("evento_pagamentos")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("evento_id", eventoId)
    .order("data_pagamento", { ascending: false })
    .returns<EventoPagamento[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
};

export const useEventoPagamentos = (eventoId: number | null) => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(currentTenantId && eventoId),
    queryFn: () => fetchEventoPagamentos(currentTenantId as number, eventoId as number),
    queryKey: eventosQueryKeys.payments(currentTenantId, eventoId),
    staleTime: 1000 * 30,
  });
};

export const useCreateEventoPagamento = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateEventoPagamentoInput): Promise<EventoPagamento> => {
      if (!currentTenantId || !user) {
        throw new Error("Sessao ou tenant atual indisponivel.");
      }

      const { data, error } = await supabase
        .from("evento_pagamentos")
        .insert({
          created_by: user.id,
          data_pagamento: input.data_pagamento,
          evento_id: input.eventoId,
          observacao: input.observacao ?? null,
          tenant_id: currentTenantId,
          updated_by: user.id,
          valor: input.valor,
        })
        .select("*")
        .single()
        .returns<EventoPagamento>();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (_pagamento, input) => {
      void queryClient.invalidateQueries({
        queryKey: eventosQueryKeys.payments(currentTenantId, input.eventoId),
      });
      void queryClient.invalidateQueries({ queryKey: financeiroQueryKeys.all(currentTenantId) });
      void queryClient.invalidateQueries({
        queryKey: financeiroQueryKeys.eventoSummary(currentTenantId, input.eventoId),
      });
    },
  });
};
