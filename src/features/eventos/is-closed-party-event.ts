import { Evento } from "./types";

/** Lead arquivado (ex.: duplicata consolidada) — oculto no Kanban do CRM. */
export const isArchivedCrmEvento = (evento: Evento): boolean =>
  evento.status_interno === "cancelado";

export const isInactiveEvento = (evento: Evento): boolean =>
  evento.etapa === "perdido" ||
  evento.status_interno === "perdido" ||
  evento.status_interno === "cancelado";

/**
 * Festa com contrato assinado (funil Festa) — aparece no calendário e trava a agenda.
 */
export const isScheduledPartyEvento = (evento: Evento): boolean =>
  !isInactiveEvento(evento) &&
  evento.tipo_evento === "festa" &&
  evento.funil === "festa";

/**
 * Visita agendada (funil Vendas, tipo visita) — aparece no calendário, mas não trava a agenda.
 * Orçamentos com data tentativa ficam fora do calendário por enquanto.
 */
export const isCalendarVisitaEvento = (evento: Evento): boolean =>
  !isInactiveEvento(evento) &&
  evento.funil === "vendas" &&
  evento.tipo_evento === "visita";

/** Orçamento em andamento (funil Vendas, tipo festa) — reservado para uso futuro no calendário. */
export const isCalendarOrcamentoEvento = (evento: Evento): boolean =>
  !isInactiveEvento(evento) &&
  evento.funil === "vendas" &&
  evento.tipo_evento === "festa";

/** @deprecated Use isScheduledPartyEvento */
export const isClosedPartyEvento = isScheduledPartyEvento;
