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
  previousEvento?: Evento;
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
    onMutate: async (input) => {
      const listQueryKey = eventosQueryKeys.list(currentTenantId, input.funnel);
      const detailQueryKey = eventosQueryKeys.detail(currentTenantId, input.eventoId);

      await queryClient.cancelQueries({ queryKey: listQueryKey });
      await queryClient.cancelQueries({ queryKey: detailQueryKey });

      const previousEventos = queryClient.getQueryData<Evento[]>(listQueryKey);
      const previousEvento = queryClient.getQueryData<Evento>(detailQueryKey);

      queryClient.setQueryData<Evento[]>(listQueryKey, (currentEventos = []) =>
        currentEventos.map((evento) =>
          evento.id === input.eventoId ? { ...evento, etapa: input.stage } : evento,
        ),
      );

      queryClient.setQueryData<Evento>(detailQueryKey, (currentEvento) =>
        currentEvento ? { ...currentEvento, etapa: input.stage } : currentEvento,
      );

      return { previousEventos, previousEvento };
    },
    onError: (_error, input, context) => {
      queryClient.setQueryData(
        eventosQueryKeys.list(currentTenantId, input.funnel),
        context?.previousEventos,
      );
      queryClient.setQueryData(
        eventosQueryKeys.detail(currentTenantId, input.eventoId),
        context?.previousEvento,
      );
    },
    onSuccess: (evento) => {
      queryClient.setQueryData(eventosQueryKeys.detail(currentTenantId, evento.id), evento);
    },
    onSettled: (_data, _error, input) => {
      void queryClient.invalidateQueries({
        queryKey: eventosQueryKeys.list(currentTenantId, input.funnel),
      });
      void queryClient.invalidateQueries({
        queryKey: eventosQueryKeys.detail(currentTenantId, input.eventoId),
      });
    },
  });
};
