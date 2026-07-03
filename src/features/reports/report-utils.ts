import { Evento, getEventBalance, getEventDisplayTotalPaid } from "@/features/eventos";
import { formatDateBR } from "@/lib/date";

import { ReportPeriod } from "./types";

export type Priority = "alta" | "media" | "baixa";

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export const formatDate = (date: string | null) => formatDateBR(date, "Sem data");

export const daysBetween = (fromDate: string, toDate = new Date()) =>
  Math.floor((toDate.getTime() - new Date(fromDate).getTime()) / (1000 * 60 * 60 * 24));

export const isDateInPeriod = (date: string | null, period: ReportPeriod) => {
  if (!date) return false;
  return date >= period.startDate && date <= period.endDate;
};

export const getEventTotalPaid = (event: Evento, paidByEventoId: Map<number, number>) =>
  getEventDisplayTotalPaid(event, paidByEventoId.get(event.id) ?? 0);

export const getEventOutstandingBalance = (event: Evento, paidByEventoId: Map<number, number>) =>
  getEventBalance(event, paidByEventoId.get(event.id) ?? 0);

export { openWhatsApp } from "@/lib/whatsapp";
