import type { Evento } from "@/features/eventos";
import { getTodayAtNoon, toLocalIsoDateKey } from "@/lib/date";

import { countNewLeadsToday } from "./count-new-leads-today";

export interface CommercialActivityCard {
  countDisplay: string;
  id: "closed-parties" | "conversion-rate" | "leads-month" | "leads-today" | "leads-week" | "sold-value";
  subtitle: string;
  title: string;
}

export interface CommercialActivity {
  cards: CommercialActivityCard[];
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  maximumFractionDigits: 0,
  style: "currency",
});

const formatCountLabel = (count: number, singular: string, plural: string) =>
  `${count} ${count === 1 ? singular : plural}`;

const getWeekIsoRange = () => {
  const today = getTodayAtNoon();
  const weekday = today.getDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    endIso: sunday.toISOString(),
    startIso: monday.toISOString(),
  };
};

const getMonthIsoRange = () => {
  const now = getTodayAtNoon();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  return {
    endIso: end.toISOString(),
    startDate: toLocalIsoDateKey(start),
    startIso: start.toISOString(),
  };
};

export const countLeadsAttendedThisWeek = (events: Evento[]) => {
  const { endIso, startIso } = getWeekIsoRange();

  return countLeadsAttendedInRange(events, startIso, endIso);
};

export const countLeadsAttendedThisMonth = (events: Evento[]) => {
  const { endIso, startIso } = getMonthIsoRange();

  return countLeadsAttendedInRange(events, startIso, endIso);
};

const countLeadsAttendedInRange = (events: Evento[], startIso: string, endIso: string) =>
  events.filter(
    (event) =>
      event.funil === "vendas" &&
      event.status_interno !== "perdido" &&
      event.created_at >= startIso &&
      event.created_at <= endIso,
  ).length;

export const buildCommercialActivity = (events: Evento[]): CommercialActivity => {
  const { endIso, startIso } = getMonthIsoRange();
  const leadsToday = countNewLeadsToday(events);
  const leadsThisWeek = countLeadsAttendedThisWeek(events);
  const leadsThisMonth = countLeadsAttendedThisMonth(events);

  const closedThisMonth = events.filter(
    (event) =>
      (event.funil === "festa" || event.funil === "executadas") &&
      event.updated_at >= startIso &&
      event.updated_at <= endIso,
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
      countDisplay: String(leadsThisWeek),
      id: "leads-week",
      subtitle: `Essa semana atendemos ${formatCountLabel(leadsThisWeek, "lead", "leads")}`,
      title: "Leads da semana",
    },
    {
      countDisplay: String(leadsThisMonth),
      id: "leads-month",
      subtitle: `Este mês atendemos ${formatCountLabel(leadsThisMonth, "lead", "leads")}`,
      title: "Leads do mês",
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
