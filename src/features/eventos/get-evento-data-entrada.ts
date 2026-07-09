import type { Evento } from "./types";

type EventoDataEntradaFields = Pick<Evento, "data_primeiro_contato" | "created_at">;

/** YYYY-MM-DD da entrada do lead (primeiro contato real ou criação no sistema). */
export const getEventoDataEntradaIso = (evento: EventoDataEntradaFields): string =>
  evento.data_primeiro_contato ?? evento.created_at.split("T")[0];

/** Referência com hora para cálculos de dias (evita deslocamento de fuso em date-only). */
export const getEventoDataEntradaInstant = (evento: EventoDataEntradaFields): string => {
  if (evento.data_primeiro_contato) {
    return `${evento.data_primeiro_contato}T12:00:00`;
  }

  return evento.created_at;
};
