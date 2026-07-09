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

interface UpdateEventoPagamentoInput {
  data_pagamento?: string;
  eventoId: number;
  id: number;
  observacao?: string | null;
  valor?: number;
}

interface DeleteEventoPagamentoInput {
  eventoId: number;
  id: number;
}

const invalidateEventoPagamentoQueries = (
  queryClient: ReturnType<typeof useQueryClient>,
  tenantId: number | null,
  eventoId: number,
) => {
  void queryClient.invalidateQueries({
    queryKey: eventosQueryKeys.payments(tenantId, eventoId),
  });
  void queryClient.invalidateQueries({ queryKey: financeiroQueryKeys.all(tenantId) });
  void queryClient.invalidateQueries({
    queryKey: financeiroQueryKeys.eventoSummary(tenantId, eventoId),
  });
};

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
      invalidateEventoPagamentoQueries(queryClient, currentTenantId, input.eventoId);
    },
  });
};

export const useUpdateEventoPagamento = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: UpdateEventoPagamentoInput): Promise<EventoPagamento> => {
      if (!currentTenantId || !user) {
        throw new Error("Sessao ou tenant atual indisponivel.");
      }

      const { data, error } = await supabase
        .from("evento_pagamentos")
        .update({
          ...(input.data_pagamento != null ? { data_pagamento: input.data_pagamento } : {}),
          ...(input.observacao !== undefined ? { observacao: input.observacao } : {}),
          ...(input.valor != null ? { valor: input.valor } : {}),
          updated_by: user.id,
        })
        .eq("tenant_id", currentTenantId)
        .eq("evento_id", input.eventoId)
        .eq("id", input.id)
        .select("*")
        .single()
        .returns<EventoPagamento>();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (_pagamento, input) => {
      invalidateEventoPagamentoQueries(queryClient, currentTenantId, input.eventoId);
    },
  });
};

export const useDeleteEventoPagamento = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();

  return useMutation({
    mutationFn: async (input: DeleteEventoPagamentoInput) => {
      if (!currentTenantId) {
        throw new Error("Tenant atual indisponivel.");
      }

      const { error } = await supabase
        .from("evento_pagamentos")
        .delete()
        .eq("tenant_id", currentTenantId)
        .eq("evento_id", input.eventoId)
        .eq("id", input.id);

      if (error) {
        throw error;
      }
    },
    onSuccess: (_data, input) => {
      invalidateEventoPagamentoQueries(queryClient, currentTenantId, input.eventoId);
    },
  });
};
