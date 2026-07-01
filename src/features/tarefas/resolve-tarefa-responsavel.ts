import type { EventoTarefa } from "@/features/eventos/types";

export const getTarefaResponsavelUserId = (
  tarefa: Pick<EventoTarefa, "assigned_to" | "created_by">,
): string | null => tarefa.assigned_to ?? tarefa.created_by;

export const resolveProfileDisplayName = (profile: {
  email?: string | null;
  full_name?: string | null;
} | null | undefined): string | null => {
  const fullName = profile?.full_name?.trim();
  if (fullName) return fullName;

  const email = profile?.email?.trim();
  if (email) return email;

  return null;
};
