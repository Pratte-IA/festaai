import { formatBrazilPhone, normalizeBrazilPhoneDigits, normalizePhoneDigits } from "@/lib/phone";
import { Evento } from "./types";

const normalizeText = (value: string | null | undefined) =>
  value
    ?.toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/\p{M}/gu, "") ?? "";

const getEventDateSearchValues = (date: string | null): string[] => {
  if (!date) return [];

  const isoDate = date.split("T")[0];
  const parsedDate = new Date(isoDate);

  if (Number.isNaN(parsedDate.getTime())) return [normalizeText(isoDate)];

  const day = String(parsedDate.getUTCDate()).padStart(2, "0");
  const month = String(parsedDate.getUTCMonth() + 1).padStart(2, "0");
  const year = parsedDate.getUTCFullYear();

  return [
    isoDate,
    `${day}/${month}/${year}`,
    `${day}/${month}`,
    `${month}/${year}`,
    String(year),
  ].map(normalizeText);
};

export const matchesEventoSearch = (evento: Evento, rawSearchTerm: string): boolean => {
  const searchTerm = normalizeText(rawSearchTerm);

  if (!searchTerm) return true;

  const nameMatch =
    normalizeText(evento.cliente_nome).includes(searchTerm) ||
    normalizeText(evento.aniversariante_nome).includes(searchTerm) ||
    normalizeText(evento.pacote_nome).includes(searchTerm);

  const searchDigits = normalizePhoneDigits(rawSearchTerm);
  const normalizedSearchDigits = normalizeBrazilPhoneDigits(rawSearchTerm) ?? searchDigits;
  const storedPhoneDigits =
    normalizeBrazilPhoneDigits(evento.cliente_telefone) ??
    normalizePhoneDigits(evento.cliente_telefone);
  const phoneMatch =
    searchDigits.length >= 3 &&
    (storedPhoneDigits.includes(normalizedSearchDigits) || storedPhoneDigits.includes(searchDigits));

  const normalizedDateSearch = searchTerm.replace(/[.-]/g, "/");
  const dateMatch = getEventDateSearchValues(evento.data_evento).some(
    (value) => value.includes(normalizedDateSearch) || value.includes(searchTerm),
  );

  return nameMatch || phoneMatch || dateMatch;
};

export const filterEventosBySearch = (eventos: Evento[], searchTerm: string): Evento[] =>
  eventos.filter((evento) => matchesEventoSearch(evento, searchTerm));
