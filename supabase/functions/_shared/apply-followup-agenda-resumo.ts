/** Injeta o resumo por casa; se o template não tiver o placeholder, anexa no final. */
export const applyFollowupAgendaResumo = (message: string, template: string, resumo: string): string => {
  const trimmedResumo = resumo.trim();
  if (!trimmedResumo) return message;

  if (template.includes("{{resumo_agenda_casas}}")) {
    return message;
  }

  return `${message.trimEnd()}\n\n${trimmedResumo}`;
};
