import { Evento } from "@/features/eventos";

const isSameLocalDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

/**
 * Lead que entrou em contato hoje e ainda não estava no funil de vendas.
 * Identificado por criação no dia com status_interno "novo" (WhatsApp inbound).
 */
export const isBrandNewLeadContactToday = (evento: Evento, referenceDate = new Date()) => {
  if (evento.funil !== "vendas" || evento.status_interno !== "novo") {
    return false;
  }

  return isSameLocalDay(new Date(evento.created_at), referenceDate);
};

/**
 * Lead que estava em perdido e voltou ao funil hoje (reativação via WhatsApp).
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
