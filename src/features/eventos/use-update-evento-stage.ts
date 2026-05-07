import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

import { eventosQueryKeys } from "./query-keys";
import { Evento, FunnelType, Stage } from "./types";

interface UpdateEventoStageInput {
  eventoId: number;
  funnel: FunnelType;
  stage: Stage;
}

interface UpdateEventoStageContext {
  previousEventos?: Evento[];
}

const updateEventoStage = async (
  tenantId: number,
  userId: string,
  input: UpdateEventoStageInput,
) => {
  const { data, error } = await supabase
    .from("eventos")
    .update({
      etapa: input.stage,
      updated_by: userId,
    })
    .eq("id", input.eventoId)
    .eq("tenant_id", tenantId)
    .eq("funil", input.funnel)
    .select("*")
    .single()
    .returns<Evento>();

  if (error) {
    throw error;
  }

  return data;
};

export const useUpdateEventoStage = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation<Evento, Error, UpdateEventoStageInput, UpdateEventoStageContext>({
    mutationFn: (input) => {
      if (!currentTenantId || !user) {
        throw new Error("Sessao ou tenant atual indisponivel.");
      }

      return updateEventoStage(currentTenantId, user.id, input);
    },
    onError: (_error, input, context) => {
      queryClient.setQueryData(
        eventosQueryKeys.list(currentTenantId, input.funnel),
        context?.previousEventos,
      );
    },
    onMutate: async (input) => {
      const queryKey = eventosQueryKeys.list(currentTenantId, input.funnel);

      await queryClient.cancelQueries({ queryKey });

      const previousEventos = queryClient.getQueryData<Evento[]>(queryKey);

      queryClient.setQueryData<Evento[]>(queryKey, (currentEventos = []) =>
        currentEventos.map((evento) =>
          evento.id === input.eventoId ? { ...evento, etapa: input.stage } : evento,
        ),
      );

      return { previousEventos };
    },
    onSettled: (_data, _error, input) => {
      void queryClient.invalidateQueries({
        queryKey: eventosQueryKeys.list(currentTenantId, input.funnel),
      });
    },
  });
};
