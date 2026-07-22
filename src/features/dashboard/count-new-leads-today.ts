import { Evento } from "@/features/eventos";
import { toLocalIsoDateKey } from "@/lib/date";

const isSameLocalDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

/** Lead que entrou no funil de vendas — fase/status atual não importa. */
const isEnteredVendasLead = (evento: Evento) =>
  evento.funil === "vendas" && evento.status_interno !== "cancelado";

const isLocalDateInInclusiveRange = (value: Date, start: Date, end: Date) => {
  const key = toLocalIsoDateKey(value);
  return key >= toLocalIsoDateKey(start) && key <= toLocalIsoDateKey(end);
};

/**
 * Lead que entrou no funil de vendas hoje (criação no dia).
 * Conta independente da fase/status atual (novo, ativo, perdido, etc.).
 */
export const isBrandNewLeadContactToday = (evento: Evento, referenceDate = new Date()) => {
  if (!isEnteredVendasLead(evento)) {
    return false;
  }

  return isSameLocalDay(new Date(evento.created_at), referenceDate);
};

/**
 * Lead que estava em perdido e voltou ao funil hoje (reativação via WhatsApp).
 * Mantém o sinal estreito de contato_inicial + status novo para evitar
 * contar qualquer atualização de lead antigo como "entrada do dia".
 */
export const isRecoveredLeadContactToday = (evento: Evento, referenceDate = new Date()) => {
  if (evento.funil !== "vendas" || evento.status_interno !== "novo") {
    return false;
  }

  if (evento.etapa !== "contato_inicial") {
    return false;
  }

  const createdAt = new Date(evento.created_at);
  const updatedAt = new Date(evento.updated_at);

  return isSameLocalDay(updatedAt, referenceDate) && !isSameLocalDay(createdAt, referenceDate);
};

export const isNewLeadContactToday = (evento: Evento, referenceDate = new Date()) =>
  isBrandNewLeadContactToday(evento, referenceDate) ||
  isRecoveredLeadContactToday(evento, referenceDate);

export const countNewLeadsToday = (eventos: Evento[], referenceDate = new Date()) =>
  eventos.filter((evento) => isNewLeadContactToday(evento, referenceDate)).length;

/**
 * Leads que entraram em um intervalo de dias locais (criação no período),
 * mais reativações que voltaram ao funil no período.
 * Fase/status atual não filtra a contagem de entradas.
 */
export const isNewLeadContactInLocalRange = (
  evento: Evento,
  rangeStart: Date,
  rangeEnd: Date,
) => {
  if (
    isEnteredVendasLead(evento) &&
    isLocalDateInInclusiveRange(new Date(evento.created_at), rangeStart, rangeEnd)
  ) {
    return true;
  }

  if (evento.funil !== "vendas" || evento.status_interno !== "novo" || evento.etapa !== "contato_inicial") {
    return false;
  }

  const createdAt = new Date(evento.created_at);
  const updatedAt = new Date(evento.updated_at);

  return (
    isLocalDateInInclusiveRange(updatedAt, rangeStart, rangeEnd) &&
    !isLocalDateInInclusiveRange(createdAt, rangeStart, rangeEnd)
  );
};

export const countNewLeadsInLocalRange = (
  eventos: Evento[],
  rangeStart: Date,
  rangeEnd: Date,
) => eventos.filter((evento) => isNewLeadContactInLocalRange(evento, rangeStart, rangeEnd)).length;
