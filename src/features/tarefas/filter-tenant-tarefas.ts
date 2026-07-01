import { getTodayAtNoon, parseIsoDateLocal } from "@/lib/date";

import type { TenantTarefaListItem, TarefaStatusFilter } from "./types";

const normalizeText = (value: string | null | undefined) =>
  (value ?? "").trim().toLowerCase();

export const isTarefaOverdue = (tarefa: TenantTarefaListItem): boolean => {
  if (tarefa.concluida || !tarefa.data_limite) return false;

  const deadline = parseIsoDateLocal(tarefa.data_limite);
  if (!deadline) return false;

  return deadline.getTime() < getTodayAtNoon().getTime();
};

export const matchesTarefaSearch = (tarefa: TenantTarefaListItem, query: string): boolean => {
  const normalized = normalizeText(query);
  if (!normalized) return true;

  const haystack = [
    tarefa.titulo,
    tarefa.responsavelNome,
    tarefa.evento?.cliente_nome,
    tarefa.evento?.aniversariante_nome,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
};

export const filterTenantTarefas = (
  tarefas: TenantTarefaListItem[],
  options: { search: string; status: TarefaStatusFilter },
): TenantTarefaListItem[] =>
  tarefas.filter((tarefa) => {
    if (options.status === "pendentes" && tarefa.concluida) return false;
    if (options.status === "concluidas" && !tarefa.concluida) return false;
    return matchesTarefaSearch(tarefa, options.search);
  });
