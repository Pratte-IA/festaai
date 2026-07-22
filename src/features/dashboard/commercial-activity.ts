import type { Evento } from "@/features/eventos";
import { getTodayAtNoon, toLocalIsoDateKey } from "@/lib/date";

import { countNewLeadsInLocalRange, countNewLeadsToday } from "./count-new-leads-today";

export interface CommercialActivityCard {
  countDisplay: string;
  id:
    | "closed-parties"
    | "conversion-rate"
    | "leads-month"
    | "leads-today"
    | "leads-week"
    | "proposals-month"
    | "sold-value";
  subtitle: string;
  title: string;
}

export interface CommercialActivity {
  cards: CommercialActivityCard[];
}

/** Contrato assinado no sistema (evento_contracts.status = accepted). */
export interface SignedContractClosing {
  accepted_at: string;
  evento_id: number;
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  maximumFractionDigits: 0,
  style: "currency",
});

const formatCountLabel = (count: number, singular: string, plural: string) =>
  `${count} ${count === 1 ? singular : plural}`;

/** Janela móvel: hoje e os 6 dias anteriores (7 dias no total). */
const getLast7DaysLocalRange = (referenceDate = getTodayAtNoon()) => {
  const today = new Date(referenceDate);
  today.setHours(12, 0, 0, 0);
  const start = new Date(today);
  start.setDate(today.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setHours(23, 59, 59, 999);

  return { end, start };
};

const getMonthLocalRange = (referenceDate = getTodayAtNoon()) => {
  const now = new Date(referenceDate);
  now.setHours(12, 0, 0, 0);
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  return {
    end,
    endIso: end.toISOString(),
    start,
    startDate: toLocalIsoDateKey(start),
    startIso: start.toISOString(),
  };
};

/** Leads novos nos últimos 7 dias (janela móvel). */
export const countNewLeadsLast7Days = (events: Evento[], referenceDate = getTodayAtNoon()) => {
  const { end, start } = getLast7DaysLocalRange(referenceDate);
  return countNewLeadsInLocalRange(events, start, end);
};

/** Leads novos do mês calendário. */
export const countNewLeadsThisMonth = (events: Evento[], referenceDate = getTodayAtNoon()) => {
  const { end, start } = getMonthLocalRange(referenceDate);
  return countNewLeadsInLocalRange(events, start, end);
};

/**
 * Propostas enviadas no mês calendário (`proposta_enviada_em`).
 * Conta independente da etapa/funil atual (pode já ter fechado ou sido perdida).
 */
export const countProposalsSentThisMonth = (events: Evento[], referenceDate = getTodayAtNoon()) => {
  const { end, start } = getMonthLocalRange(referenceDate);
  const startKey = toLocalIsoDateKey(start);
  const endKey = toLocalIsoDateKey(end);

  return events.filter((event) => {
    if (event.status_interno === "cancelado" || !event.proposta_enviada_em) {
      return false;
    }

    const sentKey = toLocalIsoDateKey(new Date(event.proposta_enviada_em));
    return sentKey >= startKey && sentKey <= endKey;
  }).length;
};

/** @deprecated Use countNewLeadsLast7Days */
export const countNewLeadsThisWeek = countNewLeadsLast7Days;

/** @deprecated Use countNewLeadsLast7Days */
export const countLeadsAttendedThisWeek = countNewLeadsLast7Days;

/** @deprecated Use countNewLeadsThisMonth */
export const countLeadsAttendedThisMonth = countNewLeadsThisMonth;

/**
 * Festas fechadas no período com contrato assinado no sistema.
 * Ignora festas criadas manualmente no funil festa (migração / sem aceite).
 */
export const getClosedPartiesWithSignedContractInRange = (
  events: Evento[],
  signedContracts: SignedContractClosing[],
  startIso: string,
  endIso: string,
): Evento[] => {
  const eventsById = new Map(events.map((event) => [event.id, event]));
  const closed: Evento[] = [];
  const seenEventoIds = new Set<number>();

  for (const contract of signedContracts) {
    if (
      !contract.accepted_at ||
      contract.accepted_at < startIso ||
      contract.accepted_at > endIso ||
      seenEventoIds.has(contract.evento_id)
    ) {
      continue;
    }

    const event = eventsById.get(contract.evento_id);
    if (!event || event.status_interno === "cancelado") {
      continue;
    }

    if (event.funil !== "festa" && event.funil !== "executadas") {
      continue;
    }

    seenEventoIds.add(contract.evento_id);
    closed.push(event);
  }

  return closed;
};

export const buildCommercialActivity = (
  events: Evento[],
  signedContracts: SignedContractClosing[] = [],
): CommercialActivity => {
  const { endIso, startIso } = getMonthLocalRange();
  const leadsToday = countNewLeadsToday(events);
  const leadsLast7Days = countNewLeadsLast7Days(events);
  const leadsThisMonth = countNewLeadsThisMonth(events);
  const proposalsThisMonth = countProposalsSentThisMonth(events);

  const closedThisMonth = getClosedPartiesWithSignedContractInRange(
    events,
    signedContracts,
    startIso,
    endIso,
  );

  const conversionRate =
    leadsThisMonth > 0 ? Math.round((closedThisMonth.length / leadsThisMonth) * 100) : 0;

  const soldValue = closedThisMonth.reduce((sum, event) => sum + event.valor_total, 0);

  const cards: CommercialActivityCard[] = [
    {
      countDisplay: String(leadsToday),
      id: "leads-today",
      subtitle: `Hoje entrou ${formatCountLabel(leadsToday, "lead", "leads")}`,
      title: "Leads de hoje",
    },
    {
      countDisplay: String(leadsLast7Days),
      id: "leads-week",
      subtitle: `Nos últimos 7 dias entraram ${formatCountLabel(leadsLast7Days, "lead novo", "leads novos")}`,
      title: "Leads nos últimos 7 dias",
    },
    {
      countDisplay: String(leadsThisMonth),
      id: "leads-month",
      subtitle: `Este mês entraram ${formatCountLabel(leadsThisMonth, "lead novo", "leads novos")}`,
      title: "Leads do mês",
    },
    {
      countDisplay: String(proposalsThisMonth),
      id: "proposals-month",
      subtitle: `Este mês enviamos ${formatCountLabel(proposalsThisMonth, "proposta", "propostas")} (inclui leads de outros meses)`,
      title: "Propostas enviadas",
    },
    {
      countDisplay: String(closedThisMonth.length),
      id: "closed-parties",
      subtitle: `Este mês fechamos ${formatCountLabel(closedThisMonth.length, "festa", "festas")}`,
      title: "Festas fechadas",
    },
    {
      countDisplay: `${conversionRate}%`,
      id: "conversion-rate",
      subtitle: `Nossa taxa de conversão foi ${conversionRate}%`,
      title: "Taxa de conversão",
    },
    {
      countDisplay: currencyFormatter.format(soldValue),
      id: "sold-value",
      subtitle: `Vendemos o valor de ${currencyFormatter.format(soldValue)}`,
      title: "Valor vendido",
    },
  ];

  return { cards };
};
