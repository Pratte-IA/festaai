import { parseChecklistConcluidos } from "@/features/eventos/evento-checklist";
import type { Evento, EventoPagamento } from "@/features/eventos";
import type { TenantTarefaListItem } from "@/features/tarefas/types";
import { getTodayAtNoon, getTodayIsoDate, parseIsoDateLocal, toLocalIsoDateKey } from "@/lib/date";

import { getEventOpenBalance } from "./festa-open-balance";

export interface DashboardOperationalItem {
  dateLabel?: string;
  eventoId: number;
  label: string;
  valueLabel?: string;
}

export interface DashboardOperationalSection {
  count: number;
  ctaHref?: string;
  ctaLabel?: string;
  emptyMessage: string;
  id: string;
  items: DashboardOperationalItem[];
  subtitle?: string;
  title: string;
  totalValueLabel?: string;
}

export interface DashboardOperationalGuide {
  hasActions: boolean;
  sections: DashboardOperationalSection[];
}

const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
});

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  maximumFractionDigits: 0,
  style: "currency",
});

const formatShortDate = (date: string) => {
  const parsed = parseIsoDateLocal(date);
  if (!parsed) return date;
  return shortDateFormatter.format(parsed).replace(".", "");
};

const getEventLabel = (event: Evento) =>
  event.aniversariante_nome
    ? `${event.cliente_nome} (${event.aniversariante_nome})`
    : event.cliente_nome;

const getWeekRange = () => {
  const today = getTodayAtNoon();
  const weekday = today.getDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    endDate: toLocalIsoDateKey(sunday),
    startDate: toLocalIsoDateKey(monday),
  };
};

const getMonthDateRange = () => {
  const now = getTodayAtNoon();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 12, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 12, 0, 0, 0);

  return {
    endDate: toLocalIsoDateKey(end),
    startDate: toLocalIsoDateKey(start),
  };
};

const isDateInRange = (date: string | null, startDate: string, endDate: string) => {
  if (!date) return false;
  return date >= startDate && date <= endDate;
};

const isActiveFesta = (event: Evento) =>
  event.funil === "festa" && event.status_interno === "ativo" && event.tipo_evento === "festa";

const buildSection = (
  id: string,
  title: string,
  count: number,
  items: DashboardOperationalItem[],
  options?: {
    ctaHref?: string;
    ctaLabel?: string;
    emptyMessage?: string;
    subtitle?: string;
    totalValueLabel?: string;
  },
): DashboardOperationalSection => ({
  count,
  ctaHref: options?.ctaHref,
  ctaLabel: options?.ctaLabel,
  emptyMessage: options?.emptyMessage ?? "Nada pendente nesta categoria.",
  id,
  items,
  subtitle: options?.subtitle,
  title,
  totalValueLabel: options?.totalValueLabel,
});

export const buildOperationalGuide = (
  events: Evento[],
  payments: EventoPagamento[],
  tarefas: TenantTarefaListItem[],
): DashboardOperationalGuide => {
  const weekRange = getWeekRange();
  const monthRange = getMonthDateRange();
  const todayIso = getTodayIsoDate();

  const paidByEvent = new Map<number, number>();
  payments.forEach((payment) => {
    paidByEvent.set(payment.evento_id, (paidByEvent.get(payment.evento_id) ?? 0) + payment.valor);
  });

  const weekParties = events
    .filter(
      (event) =>
        isActiveFesta(event) &&
        event.data_evento &&
        isDateInRange(event.data_evento, weekRange.startDate, weekRange.endDate) &&
        event.data_evento >= todayIso,
    )
    .sort((left, right) => String(left.data_evento).localeCompare(String(right.data_evento)))
    .map<DashboardOperationalItem>((event) => ({
      dateLabel: event.data_evento ? formatShortDate(event.data_evento) : undefined,
      eventoId: event.id,
      label: getEventLabel(event),
    }));

  const receivablesWithBalance = events
    .filter((event) => isActiveFesta(event) && getEventOpenBalance(event, paidByEvent) > 0)
    .sort((left, right) => String(left.data_evento ?? "").localeCompare(String(right.data_evento ?? "")));

  const receivables = receivablesWithBalance.map<DashboardOperationalItem>((event) => ({
    dateLabel: event.data_evento ? formatShortDate(event.data_evento) : undefined,
    eventoId: event.id,
    label: getEventLabel(event),
    valueLabel: currencyFormatter.format(getEventOpenBalance(event, paidByEvent)),
  }));

  const receivablesTotal = receivablesWithBalance.reduce(
    (sum, event) => sum + getEventOpenBalance(event, paidByEvent),
    0,
  );

  const pendingTarefas = tarefas.filter((tarefa) => !tarefa.concluida);

  const organizeBoasVindas = events
    .filter((event) => isActiveFesta(event) && event.etapa === "boas_vindas")
    .sort((left, right) => String(left.data_evento ?? "").localeCompare(String(right.data_evento ?? "")))
    .map<DashboardOperationalItem>((event) => ({
      dateLabel: event.data_evento ? formatShortDate(event.data_evento) : undefined,
      eventoId: event.id,
      label: getEventLabel(event),
    }));

  const startChecklist = events
    .filter((event) => {
      if (!isActiveFesta(event) || event.etapa !== "planejamento") return false;
      return parseChecklistConcluidos(event.checklist_concluidos).length === 0;
    })
    .sort((left, right) => String(left.data_evento ?? "").localeCompare(String(right.data_evento ?? "")))
    .map<DashboardOperationalItem>((event) => ({
      dateLabel: event.data_evento ? formatShortDate(event.data_evento) : undefined,
      eventoId: event.id,
      label: getEventLabel(event),
    }));

  const finalizeChecklist = events
    .filter((event) => {
      if (!isActiveFesta(event) || event.etapa !== "planejamento") return false;
      if (!isDateInRange(event.data_evento, monthRange.startDate, monthRange.endDate)) return false;
      return parseChecklistConcluidos(event.checklist_concluidos).length > 0;
    })
    .sort((left, right) => String(left.data_evento ?? "").localeCompare(String(right.data_evento ?? "")))
    .map<DashboardOperationalItem>((event) => ({
      dateLabel: event.data_evento ? formatShortDate(event.data_evento) : undefined,
      eventoId: event.id,
      label: getEventLabel(event),
    }));

  const sections: DashboardOperationalSection[] = [
    buildSection("week-parties", "Esta semana", weekParties.length, weekParties, {
      emptyMessage: "Nenhuma festa confirmada para esta semana.",
      subtitle:
        weekParties.length === 1
          ? "1 festa a ser executada"
          : `${weekParties.length} festas a serem executadas`,
    }),
    buildSection("receivables", "Valores a receber", receivables.length, receivables, {
      emptyMessage: "Nenhum saldo pendente em festas ativas.",
      subtitle:
        receivables.length === 0
          ? undefined
          : receivables.length === 1
            ? `1 festa · ${currencyFormatter.format(receivablesTotal)}`
            : `${receivables.length} festas · ${currencyFormatter.format(receivablesTotal)}`,
      totalValueLabel: currencyFormatter.format(receivablesTotal),
    }),
    buildSection("tasks", "Tarefas", pendingTarefas.length, [], {
      ctaHref: "/tarefas",
      ctaLabel: "Ir para as tarefas",
      emptyMessage: "Nenhuma tarefa pendente.",
      subtitle:
        pendingTarefas.length === 1
          ? "1 tarefa precisa ser realizada"
          : `${pendingTarefas.length} tarefas precisam ser realizadas`,
    }),
    buildSection("organize-boas-vindas", "Começar a organizar", organizeBoasVindas.length, organizeBoasVindas, {
      emptyMessage: "Nenhuma festa aguardando organização em Boas Vindas.",
      subtitle:
        organizeBoasVindas.length === 1
          ? "1 festa em Boas Vindas"
          : `${organizeBoasVindas.length} festas em Boas Vindas`,
    }),
    buildSection("start-checklist", "Iniciar checklist", startChecklist.length, startChecklist, {
      emptyMessage: "Nenhuma festa aguardando o primeiro item do checklist.",
      subtitle:
        startChecklist.length === 1
          ? "1 festa em Planejamento sem checklist iniciado"
          : `${startChecklist.length} festas em Planejamento sem checklist iniciado`,
    }),
    buildSection("finalize-checklist", "Finalizar checklist", finalizeChecklist.length, finalizeChecklist, {
      emptyMessage: "Nenhuma festa do mês com checklist em andamento.",
      subtitle:
        finalizeChecklist.length === 1
          ? "1 festa do mês precisa concluir o checklist"
          : `${finalizeChecklist.length} festas do mês precisam concluir o checklist`,
    }),
  ];

  const hasActions = sections.some((section) => section.count > 0);

  return { hasActions, sections };
};
