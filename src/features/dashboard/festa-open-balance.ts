import { Evento, getEventBalance } from "@/features/eventos";
import { toLocalIsoDateKey } from "@/lib/date";

export const getEventOpenBalance = (event: Evento, paidByEvent: Map<number, number>) =>
  getEventBalance(event, paidByEvent.get(event.id) ?? 0);

export const isFestaWithOpenBalance = (event: Evento, paidByEvent: Map<number, number>) =>
  event.funil === "festa" && getEventOpenBalance(event, paidByEvent) > 0;

export const sumFestaOpenBalance = (events: Evento[], paidByEvent: Map<number, number>) =>
  events.reduce((sum, event) => {
    if (!isFestaWithOpenBalance(event, paidByEvent)) return sum;
    return sum + getEventOpenBalance(event, paidByEvent);
  }, 0);

export const sumFestaOverdueOpenBalance = (
  events: Evento[],
  paidByEvent: Map<number, number>,
  referenceDate = new Date(),
) => {
  const today = toLocalIsoDateKey(referenceDate);

  return events.reduce((sum, event) => {
    if (!isFestaWithOpenBalance(event, paidByEvent)) return sum;
    if (!event.data_evento || event.data_evento >= today) return sum;
    return sum + getEventOpenBalance(event, paidByEvent);
  }, 0);
};
