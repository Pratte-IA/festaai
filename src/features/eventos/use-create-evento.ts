import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
import { financeiroQueryKeys } from "@/features/financeiro/query-keys";
import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

import { resolveUnitIdForFunnel } from "./funnel-visibility";
import { eventosQueryKeys } from "./query-keys";
import { Evento, EventoInsert } from "./types";

type CreateEventoInput = Omit<EventoInsert, "created_by" | "tenant_id" | "unit_id" | "updated_by">;

export const useCreateEvento = () => {
  const queryClient = useQueryClient();
  const { currentTenantId, currentUnitId, units } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateEventoInput): Promise<Evento> => {
      const unitId = resolveUnitIdForFunnel(input.funil, currentUnitId, units);

      if (!currentTenantId || !unitId || !user) {
        throw new Error("Sessao ou tenant atual indisponivel.");
      }

      const { data, error } = await supabase
        .from("eventos")
        .insert({
          ...input,
          created_by: user.id,
          tenant_id: currentTenantId,
          unit_id: unitId,
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
    onSuccess: (evento) => {
      void queryClient.invalidateQueries({
        queryKey: eventosQueryKeys.all(currentTenantId),
      });
      if (Number(evento.valor_entrada) > 0) {
        void queryClient.invalidateQueries({ queryKey: financeiroQueryKeys.all(currentTenantId) });
      }
    },
  });
};
