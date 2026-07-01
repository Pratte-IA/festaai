import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

import { eventosQueryKeys } from "./query-keys";
import { EventoTarefa } from "./types";

interface CreateEventoTarefaInput {
  assignedTo?: string | null;
  dataLimite?: string | null;
  eventoId: number;
  titulo: string;
}

interface ToggleEventoTarefaInput {
  concluida: boolean;
  eventoId: number;
  tarefaId: number;
}

interface UpdateEventoTarefaInput {
  assignedTo?: string | null;
  dataLimite?: string | null;
  eventoId: number;
  tarefaId: number;
  titulo?: string;
}

interface DeleteEventoTarefaInput {
  eventoId: number;
  tarefaId: number;
}

const invalidateTarefaQueries = (
  queryClient: QueryClient,
  tenantId: number | null,
  eventoId: number,
) => {
  void queryClient.invalidateQueries({
    queryKey: eventosQueryKeys.tasks(tenantId, eventoId),
  });
  void queryClient.invalidateQueries({
    queryKey: eventosQueryKeys.tenantTasks(tenantId),
  });
};

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
          assigned_to: input.assignedTo ?? user.id,
          created_by: user.id,
          data_limite: input.dataLimite ?? null,
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
      invalidateTarefaQueries(queryClient, currentTenantId, input.eventoId);
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
      invalidateTarefaQueries(queryClient, currentTenantId, input.eventoId);
    },
  });
};

export const useUpdateEventoTarefa = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: UpdateEventoTarefaInput): Promise<EventoTarefa> => {
      if (!currentTenantId || !user) {
        throw new Error("Sessao ou tenant atual indisponivel.");
      }

      const payload: Record<string, unknown> = {
        updated_by: user.id,
      };

      if (input.titulo !== undefined) {
        payload.titulo = input.titulo;
      }

      if (input.dataLimite !== undefined) {
        payload.data_limite = input.dataLimite;
      }

      if (input.assignedTo !== undefined) {
        payload.assigned_to = input.assignedTo;
      }

      const { data, error } = await supabase
        .from("evento_tarefas")
        .update(payload)
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
      invalidateTarefaQueries(queryClient, currentTenantId, input.eventoId);
    },
  });
};

export const useDeleteEventoTarefa = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();

  return useMutation({
    mutationFn: async (input: DeleteEventoTarefaInput): Promise<void> => {
      if (!currentTenantId) {
        throw new Error("Tenant atual indisponivel.");
      }

      const { error } = await supabase
        .from("evento_tarefas")
        .delete()
        .eq("id", input.tarefaId)
        .eq("evento_id", input.eventoId)
        .eq("tenant_id", currentTenantId);

      if (error) {
        throw error;
      }
    },
    onSuccess: (_result, input) => {
      invalidateTarefaQueries(queryClient, currentTenantId, input.eventoId);
    },
  });
};
