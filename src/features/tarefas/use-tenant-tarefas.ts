import { useQuery } from "@tanstack/react-query";

import { eventosQueryKeys } from "@/features/eventos/query-keys";
import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

import {
  getTarefaResponsavelUserId,
  resolveProfileDisplayName,
} from "./resolve-tarefa-responsavel";
import type { TenantTarefaEvento, TenantTarefaListItem } from "./types";

interface EventoTarefaRow {
  assigned_to: string | null;
  concluida: boolean;
  created_at: string;
  created_by: string | null;
  data_limite: string | null;
  evento_id: number;
  eventos: TenantTarefaEvento | TenantTarefaEvento[] | null;
  id: number;
  ordem: number;
  tenant_id: number;
  titulo: string;
  updated_at: string;
  updated_by: string | null;
}

interface ProfileRow {
  email: string | null;
  full_name: string | null;
  id: string;
}

const mapTenantTarefa = (
  row: EventoTarefaRow,
  profileById: Map<string, ProfileRow>,
): TenantTarefaListItem => {
  const evento = Array.isArray(row.eventos) ? (row.eventos[0] ?? null) : row.eventos;
  const responsavelUserId = getTarefaResponsavelUserId(row);
  const responsavelProfile = responsavelUserId ? profileById.get(responsavelUserId) : null;

  return {
    assigned_to: row.assigned_to,
    concluida: row.concluida,
    created_at: row.created_at,
    created_by: row.created_by,
    data_limite: row.data_limite,
    evento,
    evento_id: row.evento_id,
    id: row.id,
    ordem: row.ordem,
    responsavelNome: resolveProfileDisplayName(responsavelProfile) ?? "Usuario",
    tenant_id: row.tenant_id,
    titulo: row.titulo,
    updated_at: row.updated_at,
    updated_by: row.updated_by,
  };
};

const fetchTenantTarefas = async (tenantId: number): Promise<TenantTarefaListItem[]> => {
  const { data, error } = await supabase
    .from("evento_tarefas")
    .select(
      `
        id,
        tenant_id,
        evento_id,
        titulo,
        concluida,
        ordem,
        data_limite,
        assigned_to,
        created_at,
        updated_at,
        created_by,
        updated_by,
        eventos (
          id,
          cliente_nome,
          aniversariante_nome,
          data_evento
        )
      `,
    )
    .eq("tenant_id", tenantId)
    .order("concluida", { ascending: true })
    .order("data_limite", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .returns<EventoTarefaRow[]>();

  if (error) {
    throw error;
  }

  const rows = data ?? [];
  const userIds = [
    ...new Set(
      rows
        .map((row) => getTarefaResponsavelUserId(row))
        .filter((userId): userId is string => Boolean(userId)),
    ),
  ];

  const profileById = new Map<string, ProfileRow>();
  if (userIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds);

    if (profileError) {
      throw profileError;
    }

    for (const profile of profiles ?? []) {
      profileById.set(profile.id, profile);
    }
  }

  return rows.map((row) => mapTenantTarefa(row, profileById));
};

export const useTenantTarefas = () => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(currentTenantId),
    queryFn: () => fetchTenantTarefas(currentTenantId as number),
    queryKey: eventosQueryKeys.tenantTasks(currentTenantId),
    staleTime: 1000 * 30,
  });
};
