import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

import { eventosQueryKeys } from "./query-keys";
import { Evento, EventoInsert } from "./types";

type CreateEventoInput = Omit<EventoInsert, "created_by" | "tenant_id" | "updated_by">;

export const useCreateEvento = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateEventoInput): Promise<Evento> => {
      if (!currentTenantId || !user) {
        throw new Error("Sessao ou tenant atual indisponivel.");
      }

      const { data, error } = await supabase
        .from("eventos")
        .insert({
          ...input,
          created_by: user.id,
          tenant_id: currentTenantId,
          updated_by: user.id,
        })
        .select("*")
        .single()
        .returns<Evento>();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: eventosQueryKeys.all(currentTenantId),
      });
    },
  });
};
