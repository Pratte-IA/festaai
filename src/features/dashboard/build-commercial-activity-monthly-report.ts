import type { Evento } from "@/features/eventos";
import { getTodayAtNoon, toLocalIsoDateKey } from "@/lib/date";

import {
  getClosedPartiesWithSignedContractInRange,
  type SignedContractClosing,
} from "./commercial-activity";
import { countNewLeadsInLocalRange } from "./count-new-leads-today";

export interface CommercialActivityMonthRow {
  closedParties: number;
  conversionRate: number;
  leadsEntered: number;
  monthKey: string;
  monthLabel: string;
  soldValue: number;
}

const monthLabelFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});

const toMonthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const parseMonthKey = (monthKey: string): Date => {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1, 12, 0, 0, 0);
};

const formatMonthLabel = (monthKey: string) => {
  const label = monthLabelFormatter.format(parseMonthKey(monthKey));
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const getMonthBounds = (monthKey: string) => {
  const start = parseMonthKey(monthKey);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999);

  return {
    end,
    endIso: end.toISOString(),
    start,
    startDate: toLocalIsoDateKey(start),
    startIso: start.toISOString(),
  };
};

const collectRelevantTimestamps = (
  events: Evento[],
  signedContracts: SignedContractClosing[],
): number[] => {
  const timestamps: number[] = [];

  for (const event of events) {
    if (event.funil === "vendas" && event.status_interno !== "cancelado") {
      timestamps.push(new Date(event.created_at).getTime());
    }
  }

  for (const contract of signedContracts) {
    if (contract.accepted_at) {
      timestamps.push(new Date(contract.accepted_at).getTime());
    }
  }

  return timestamps.filter((value) => Number.isFinite(value));
};

const listMonthKeysInclusive = (startMonthKey: string, endMonthKey: string): string[] => {
  const keys: string[] = [];
  const cursor = parseMonthKey(startMonthKey);
  const end = parseMonthKey(endMonthKey);

  while (cursor <= end) {
    keys.push(toMonthKey(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return keys;
};

/**
 * Relatório mês a mês da atividade comercial, a partir do primeiro mês com dados
 * do tenant até o mês de referência (padrão: mês atual).
 */
export const buildCommercialActivityMonthlyReport = (
  events: Evento[],
  signedContracts: SignedContractClosing[],
  referenceDate = getTodayAtNoon(),
): CommercialActivityMonthRow[] => {
  const timestamps = collectRelevantTimestamps(events, signedContracts);
  if (timestamps.length === 0) {
    return [];
  }

  const earliest = new Date(Math.min(...timestamps));
  earliest.setHours(12, 0, 0, 0);
  const startMonthKey = toMonthKey(earliest);
  const endMonthKey = toMonthKey(referenceDate);

  return listMonthKeysInclusive(startMonthKey, endMonthKey).map((monthKey) => {
    const { end, endIso, start, startIso } = getMonthBounds(monthKey);
    const leadsEntered = countNewLeadsInLocalRange(events, start, end);
    const closedPartiesEvents = getClosedPartiesWithSignedContractInRange(
      events,
      signedContracts,
      startIso,
      endIso,
    );
    const closedParties = closedPartiesEvents.length;
    const soldValue = closedPartiesEvents.reduce((sum, event) => sum + event.valor_total, 0);
    const conversionRate =
      leadsEntered > 0 ? Math.round((closedParties / leadsEntered) * 100) : 0;

    return {
      closedParties,
      conversionRate,
      leadsEntered,
      monthKey,
      monthLabel: formatMonthLabel(monthKey),
      soldValue,
    };
  });
};
