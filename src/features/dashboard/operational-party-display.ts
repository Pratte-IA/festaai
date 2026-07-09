import type { Evento } from "@/features/eventos";
import { extractDisplayFirstName } from "@/lib/company-display-name";
import { compareIsoDateToToday, parseIsoDateLocal } from "@/lib/date";

const shortMonthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "short" });
const weekdayFormatter = new Intl.DateTimeFormat("pt-BR", { weekday: "long" });

const PARTY_STAGE_LABELS = {
  boas_vindas: "Boas Vindas",
  festa_pronta: "Festa Pronta",
  planejamento: "Planejamento",
} as const;

export type DashboardPartyStatusLabel = (typeof PARTY_STAGE_LABELS)[keyof typeof PARTY_STAGE_LABELS];

export const formatOperationalPartyDateLabel = (isoDate: string | null | undefined): string | undefined => {
  if (!isoDate) return undefined;

  const parsed = parseIsoDateLocal(isoDate);
  if (!parsed) return undefined;

  const day = parsed.getDate();
  const month = shortMonthFormatter.format(parsed).replace(".", "").trim();
  const monthLabel = month.charAt(0).toUpperCase() + month.slice(1);
  const weekday = weekdayFormatter.format(parsed);
  const weekdayLabel = weekday.charAt(0).toUpperCase() + weekday.slice(1);

  return `${day} ${monthLabel} - ${weekdayLabel}`;
};

export const formatRelativeDaysLabel = (diff: number | null): string | undefined => {
  if (diff === null) return undefined;
  if (diff === 0) return "é hoje";
  if (diff === 1) return "Falta 1 dia";
  if (diff > 1) return `Faltam ${diff} dias`;
  if (diff === -1) return "há 1 dia";
  return `há ${Math.abs(diff)} dias`;
};

export const getRelativeDaysLabel = (isoDate: string | null | undefined): string | undefined => {
  if (!isoDate) return undefined;
  return formatRelativeDaysLabel(compareIsoDateToToday(isoDate));
};

export const getOperationalPartyStatusLabel = (event: Evento): DashboardPartyStatusLabel | undefined => {
  if (event.etapa === "boas_vindas") return PARTY_STAGE_LABELS.boas_vindas;
  if (event.etapa === "planejamento") return PARTY_STAGE_LABELS.planejamento;
  if (event.etapa === "festa_pronta") return PARTY_STAGE_LABELS.festa_pronta;
  return undefined;
};

export interface DashboardOperationalPartyDisplay {
  aniversarianteNome: string;
  clienteNome: string;
  hasAniversariante: boolean;
  isSamePerson: boolean;
  partyDateLabel?: string;
  partyDaysLabel?: string;
  statusLabel?: DashboardPartyStatusLabel;
}

export const buildOperationalPartyDisplay = (event: Evento): DashboardOperationalPartyDisplay => {
  const hasAniversariante = Boolean(event.aniversariante_nome?.trim());
  const aniversarianteNome = extractDisplayFirstName(event.aniversariante_nome ?? event.cliente_nome);
  const clienteNome = extractDisplayFirstName(event.cliente_nome);
  const isSamePerson =
    !hasAniversariante ||
    aniversarianteNome.toLowerCase() === clienteNome.toLowerCase();

  return {
    aniversarianteNome,
    clienteNome,
    hasAniversariante,
    isSamePerson,
    partyDateLabel: formatOperationalPartyDateLabel(event.data_evento),
    partyDaysLabel: getRelativeDaysLabel(event.data_evento),
    statusLabel: getOperationalPartyStatusLabel(event),
  };
};
