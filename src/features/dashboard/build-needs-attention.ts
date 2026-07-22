import type { Evento, EventoPagamento } from "@/features/eventos";
import { getTodayAtNoon, parseIsoDateLocal, toLocalIsoDateKey } from "@/lib/date";

import { getEventOpenBalance, isFestaWithOpenBalance } from "./festa-open-balance";
import { isReceivableOverdue } from "./receivable-due-window";

export type NeedsAttentionSectionId =
  | "financeiro"
  | "follows-parados"
  | "organizar-boas-vindas"
  | "checklist-30-dias"
  | "prova-social-mkt";

export interface NeedsAttentionItem {
  description: string;
  eventoId: number;
  title: string;
}

export interface NeedsAttentionSection {
  emptyMessage: string;
  id: NeedsAttentionSectionId;
  items: NeedsAttentionItem[];
  title: string;
}

export interface NeedsAttention {
  sections: NeedsAttentionSection[];
  totalCount: number;
}

const CHECKLIST_ATTENTION_DAYS = 30;
const DAY_MS = 1000 * 60 * 60 * 24;

const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
});

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  maximumFractionDigits: 0,
  style: "currency",
});

const shortDate = (date: string) => {
  const parsed = parseIsoDateLocal(date);
  if (!parsed) return date;
  return shortDateFormatter.format(parsed).replace(".", "");
};

const eventTitle = (event: Evento) =>
  `${event.cliente_nome}${event.data_evento ? ` - Festa ${shortDate(event.data_evento)}` : ""}`;

const isActiveFesta = (event: Evento) =>
  event.funil === "festa" && event.status_interno === "ativo" && event.tipo_evento === "festa";

const daysUntilParty = (dataEvento: string, referenceDate: Date) => {
  const party = parseIsoDateLocal(dataEvento);
  if (!party) return null;

  const reference = new Date(referenceDate);
  reference.setHours(12, 0, 0, 0);
  return Math.round((party.getTime() - reference.getTime()) / DAY_MS);
};

/** Follow comercial pausado porque o cliente respondeu — precisa de ação humana. */
export const isPausedFollowNeedingAttention = (event: Evento) =>
  event.funil === "vendas" &&
  event.status_interno !== "perdido" &&
  event.status_interno !== "cancelado" &&
  event.followup_status === "pausado_resposta";

/** Festa em Planejamento nos próximos 30 dias (checklist ainda não concluiu). */
export const isPartyWithinDaysNeedingChecklist = (
  event: Evento,
  referenceDate = getTodayAtNoon(),
  maxDays = CHECKLIST_ATTENTION_DAYS,
) => {
  if (!isActiveFesta(event) || event.etapa !== "planejamento" || !event.data_evento) {
    return false;
  }

  const daysUntil = daysUntilParty(event.data_evento, referenceDate);
  return daysUntil !== null && daysUntil >= 0 && daysUntil <= maxDays;
};

/** Festa em Prova Social - Marketing aguardando tratamento do time. */
export const isProvaSocialMktNeedingAttention = (
  event: Evento,
  referenceDate = getTodayAtNoon(),
) => {
  if (
    event.funil !== "executadas" ||
    event.etapa !== "redes_sociais" ||
    event.status_interno === "cancelado"
  ) {
    return false;
  }

  if (!event.data_evento) return true;

  const daysUntil = daysUntilParty(event.data_evento, referenceDate);
  return daysUntil !== null && daysUntil < 0;
};

const sortByPartyDate = (left: Evento, right: Evento) =>
  String(left.data_evento ?? "9999-99-99").localeCompare(String(right.data_evento ?? "9999-99-99"));

const sortByPartyDateOldestFirst = (left: Evento, right: Evento) =>
  String(left.data_evento ?? "0000-00-00").localeCompare(String(right.data_evento ?? "0000-00-00"));

export const buildNeedsAttention = (
  events: Evento[],
  payments: EventoPagamento[],
  options?: { referenceDate?: Date },
): NeedsAttention => {
  const referenceDate = options?.referenceDate ?? getTodayAtNoon();
  const todayIso = toLocalIsoDateKey(referenceDate);

  const paidByEvent = new Map<number, number>();
  payments.forEach((payment) => {
    paidByEvent.set(payment.evento_id, (paidByEvent.get(payment.evento_id) ?? 0) + payment.valor);
  });

  const financeiroEvents = events
    .filter(
      (event) =>
        isFestaWithOpenBalance(event, paidByEvent) && isReceivableOverdue(event, todayIso),
    )
    .sort((left, right) => {
      const leftBalance = getEventOpenBalance(left, paidByEvent);
      const rightBalance = getEventOpenBalance(right, paidByEvent);
      return rightBalance - leftBalance;
    });

  const followsParados = events
    .filter(isPausedFollowNeedingAttention)
    .sort((left, right) => right.updated_at.localeCompare(left.updated_at));

  const boasVindas = events
    .filter((event) => {
      if (!isActiveFesta(event) || event.etapa !== "boas_vindas" || !event.data_evento) {
        return false;
      }

      const daysUntil = daysUntilParty(event.data_evento, referenceDate);
      return daysUntil !== null && daysUntil >= 0 && daysUntil <= CHECKLIST_ATTENTION_DAYS;
    })
    .sort(sortByPartyDate);

  const checklist30Dias = events
    .filter((event) => isPartyWithinDaysNeedingChecklist(event, referenceDate))
    .sort(sortByPartyDate);

  const provaSocialMkt = events
    .filter((event) => isProvaSocialMktNeedingAttention(event, referenceDate))
    .sort(sortByPartyDateOldestFirst);

  const sections: NeedsAttentionSection[] = [
    {
      emptyMessage: "Nenhum saldo com vencimento ultrapassado.",
      id: "financeiro",
      items: financeiroEvents.map((event) => ({
        description: `Saldo ${currencyFormatter.format(getEventOpenBalance(event, paidByEvent))} com vencimento ultrapassado`,
        eventoId: event.id,
        title: eventTitle(event),
      })),
      title: "Financeiro",
    },
    {
      emptyMessage: "Nenhum follow parado aguardando sua resposta.",
      id: "follows-parados",
      items: followsParados.map((event) => ({
        description: "Cliente respondeu — follow automático pausado",
        eventoId: event.id,
        title: eventTitle(event),
      })),
      title: "Follows parados",
    },
    {
      emptyMessage: "Nenhuma festa em Boas Vindas nos próximos 30 dias.",
      id: "organizar-boas-vindas",
      items: boasVindas.map((event) => {
        const daysUntil = event.data_evento ? daysUntilParty(event.data_evento, referenceDate) : null;
        const daysLabel =
          daysUntil === 0 ? "hoje" : daysUntil === 1 ? "em 1 dia" : `em ${daysUntil} dias`;

        return {
          description: `Boas Vindas — festa ${daysLabel}`,
          eventoId: event.id,
          title: eventTitle(event),
        };
      }),
      title: "Organizar festas",
    },
    {
      emptyMessage: "Nenhuma festa nos próximos 30 dias sem checklist concluído.",
      id: "checklist-30-dias",
      items: checklist30Dias.map((event) => {
        const daysUntil = event.data_evento ? daysUntilParty(event.data_evento, referenceDate) : null;
        const daysLabel =
          daysUntil === 0 ? "hoje" : daysUntil === 1 ? "em 1 dia" : `em ${daysUntil} dias`;

        return {
          description: `Festa ${daysLabel} — checklist ainda em Planejamento`,
          eventoId: event.id,
          title: eventTitle(event),
        };
      }),
      title: "Checklist (≤ 30 dias)",
    },
    {
      emptyMessage: "Nenhuma festa pendente de prova social / marketing.",
      id: "prova-social-mkt",
      items: provaSocialMkt.map((event) => {
        const daysUntil = event.data_evento ? daysUntilParty(event.data_evento, referenceDate) : null;
        const daysAgo = daysUntil !== null ? Math.abs(daysUntil) : null;
        const daysLabel =
          daysAgo === null
            ? "sem data da festa"
            : daysAgo === 0
              ? "festa hoje"
              : daysAgo === 1
                ? "festa há 1 dia"
                : `festa há ${daysAgo} dias`;

        return {
          description: `${daysLabel} — aguardando tratamento em Prova Social`,
          eventoId: event.id,
          title: eventTitle(event),
        };
      }),
      title: "Prova social - MKT",
    },
  ];

  return {
    sections,
    totalCount: sections.reduce((sum, section) => sum + section.items.length, 0),
  };
};
