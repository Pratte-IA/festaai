import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

import { eventosQueryKeys } from "./query-keys";
import { EventoNota } from "./types";

interface CreateEventoNotaInput {
  eventoId: number;
  texto: string;
}

const fetchEventoNotas = async (tenantId: number, eventoId: number): Promise<EventoNota[]> => {
  const { data, error } = await supabase
    .from("evento_notas")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("evento_id", eventoId)
    .order("created_at", { ascending: false })
    .returns<EventoNota[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
};

export const useEventoNotas = (eventoId: number | null) => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(currentTenantId && eventoId),
    queryFn: () => fetchEventoNotas(currentTenantId as number, eventoId as number),
    queryKey: eventosQueryKeys.notes(currentTenantId, eventoId),
    staleTime: 1000 * 30,
  });
};

export const useCreateEventoNota = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateEventoNotaInput): Promise<EventoNota> => {
      if (!currentTenantId || !user) {
        throw new Error("Sessao ou tenant atual indisponivel.");
      }

      const { data, error } = await supabase
        .from("evento_notas")
        .insert({
          created_by: user.id,
          evento_id: input.eventoId,
          tenant_id: currentTenantId,
          texto: input.texto,
          updated_by: user.id,
        })
        .select("*")
        .single()
        .returns<EventoNota>();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (_nota, input) => {
      void queryClient.invalidateQueries({
        queryKey: eventosQueryKeys.notes(currentTenantId, input.eventoId),
      });
    },
  });
};
