import { Evento } from "./types";

export const filterExecutadasFunnelEvents = (events: Evento[]) =>
  events.filter((event) => event.funil === "executadas");

export const filterExecutadasFunnelEventsByPartyDate = (
  events: Evento[],
  startDate?: string,
  endDate?: string,
) => {
  const executadas = filterExecutadasFunnelEvents(events);

  if (!startDate && !endDate) return executadas;

  return executadas.filter((event) => {
    if (!event.data_evento) return true;

    if (startDate && event.data_evento < startDate) return false;
    if (endDate && event.data_evento > endDate) return false;
    return true;
  });
};
