import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

import { eventosQueryKeys } from "./query-keys";
import { EventoTarefa } from "./types";

interface CreateEventoTarefaInput {
  eventoId: number;
  titulo: string;
}

interface ToggleEventoTarefaInput {
  concluida: boolean;
  eventoId: number;
  tarefaId: number;
}

const fetchEventoTarefas = async (tenantId: number, eventoId: number): Promise<EventoTarefa[]> => {
  const { data, error } = await supabase
    .from("evento_tarefas")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("evento_id", eventoId)
    .order("concluida", { ascending: true })
    .order("ordem", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<EventoTarefa[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
};

export const useEventoTarefas = (eventoId: number | null) => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(currentTenantId && eventoId),
    queryFn: () => fetchEventoTarefas(currentTenantId as number, eventoId as number),
    queryKey: eventosQueryKeys.tasks(currentTenantId, eventoId),
    staleTime: 1000 * 30,
  });
};

export const useCreateEventoTarefa = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateEventoTarefaInput): Promise<EventoTarefa> => {
      if (!currentTenantId || !user) {
        throw new Error("Sessao ou tenant atual indisponivel.");
      }

      const { data, error } = await supabase
        .from("evento_tarefas")
        .insert({
          created_by: user.id,
          evento_id: input.eventoId,
          tenant_id: currentTenantId,
          titulo: input.titulo,
          updated_by: user.id,
        })
        .select("*")
        .single()
        .returns<EventoTarefa>();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (_tarefa, input) => {
      void queryClient.invalidateQueries({
        queryKey: eventosQueryKeys.tasks(currentTenantId, input.eventoId),
      });
    },
  });
};

export const useToggleEventoTarefa = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: ToggleEventoTarefaInput): Promise<EventoTarefa> => {
      if (!currentTenantId || !user) {
        throw new Error("Sessao ou tenant atual indisponivel.");
      }

      const { data, error } = await supabase
        .from("evento_tarefas")
        .update({
          concluida: input.concluida,
          updated_by: user.id,
        })
        .eq("id", input.tarefaId)
        .eq("evento_id", input.eventoId)
        .eq("tenant_id", currentTenantId)
        .select("*")
        .single()
        .returns<EventoTarefa>();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (_tarefa, input) => {
      void queryClient.invalidateQueries({
        queryKey: eventosQueryKeys.tasks(currentTenantId, input.eventoId),
      });
    },
  });
};
