import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

import { eventosQueryKeys } from "./query-keys";
import { Evento, EventoUpdate } from "./types";

interface UpdateEventoInput {
  eventoId: number;
  values: Omit<EventoUpdate, "id" | "tenant_id" | "updated_by">;
}

export const useUpdateEvento = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ eventoId, values }: UpdateEventoInput): Promise<Evento> => {
      if (!currentTenantId || !user) {
        throw new Error("Sessao ou tenant atual indisponivel.");
      }

      const { data, error } = await supabase
        .from("eventos")
        .update({
          ...values,
          updated_by: user.id,
        })
        .eq("id", eventoId)
        .eq("tenant_id", currentTenantId)
        .select("*")
        .single()
        .returns<Evento>();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (evento) => {
      queryClient.setQueryData(eventosQueryKeys.detail(currentTenantId, evento.id), evento);
      void queryClient.invalidateQueries({
        queryKey: eventosQueryKeys.all(currentTenantId),
      });
    },
  });
};
