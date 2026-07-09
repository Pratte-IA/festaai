import { parseChecklistConcluidos } from "@/features/eventos/evento-checklist";
import type { Evento, EventoPagamento } from "@/features/eventos";
import type { TenantTarefaListItem } from "@/features/tarefas/types";
import { isTarefaOverdue } from "@/features/tarefas/filter-tenant-tarefas";
import { getTodayAtNoon, getTodayIsoDate, toLocalIsoDateKey } from "@/lib/date";

import { getEventOpenBalance } from "./festa-open-balance";
import { buildOperationalPartyDisplay, formatOperationalPartyDateLabel } from "./operational-party-display";
import { getReceivableDueDate, isReceivableOverdue, shouldShowInReceivablesCard } from "./receivable-due-window";

export interface DashboardOperationalItem {
  aniversarianteNome: string;
  clienteNome: string;
  dueDateLabel?: string;
  eventoId: number;
  isOverdue?: boolean;
  isSamePerson: boolean;
  partyDateLabel?: string;
  partyDaysLabel?: string;
  statusLabel?: string;
  valueLabel?: string;
}

export interface DashboardOperationalTaskItem {
  dueDateLabel?: string;
  eventoId: number;
  eventoLabel: string;
  isOverdue: boolean;
  tarefaId: number;
  titulo: string;
}

export interface DashboardOperationalSection {
  alwaysShow?: boolean;
  count: number;
  ctaHref?: string;
  ctaLabel?: string;
  emptyMessage: string;
  id: string;
  items: DashboardOperationalItem[];
  listHref?: string;
  subtitle?: string;
  taskItems?: DashboardOperationalTaskItem[];
  title: string;
  totalValueLabel?: string;
}

export interface DashboardOperationalSummary {
  organizeCount: number;
  pendingChecklistsCount: number;
  receivablesTotal: number;
  weekPartiesCount: number;
}

export interface DashboardOperationalGuide {
  hasActions: boolean;
  sections: DashboardOperationalSection[];
  summary: DashboardOperationalSummary;
  summaryLines: string[];
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  maximumFractionDigits: 0,
  style: "currency",
});

const mapEventToOperationalItem = (
  event: Evento,
  options?: { dueDateLabel?: string; isOverdue?: boolean; valueLabel?: string },
): DashboardOperationalItem => {
  const display = buildOperationalPartyDisplay(event);

  return {
    aniversarianteNome: display.aniversarianteNome,
    clienteNome: display.clienteNome,
    dueDateLabel: options?.dueDateLabel,
    eventoId: event.id,
    isOverdue: options?.isOverdue,
    isSamePerson: display.isSamePerson,
    partyDateLabel: display.partyDateLabel,
    partyDaysLabel: display.partyDaysLabel,
    statusLabel: display.statusLabel,
    valueLabel: options?.valueLabel,
  };
};

const getTarefaEventLabel = (tarefa: TenantTarefaListItem) => {
  const evento = tarefa.evento;
  if (!evento) return "Evento removido";

  return evento.aniversariante_nome
    ? `${evento.cliente_nome} (${evento.aniversariante_nome})`
    : evento.cliente_nome;
};

const mapTarefaToOperationalTaskItem = (tarefa: TenantTarefaListItem): DashboardOperationalTaskItem => ({
  dueDateLabel: tarefa.data_limite ? formatOperationalPartyDateLabel(tarefa.data_limite) : undefined,
  eventoId: tarefa.evento_id,
  eventoLabel: getTarefaEventLabel(tarefa),
  isOverdue: isTarefaOverdue(tarefa),
  tarefaId: tarefa.id,
  titulo: tarefa.titulo,
});

const sortPendingTarefas = (tarefas: TenantTarefaListItem[]) =>
  [...tarefas].sort((left, right) => {
    const leftOverdue = isTarefaOverdue(left);
    const rightOverdue = isTarefaOverdue(right);
    if (leftOverdue !== rightOverdue) return leftOverdue ? -1 : 1;
    return String(left.data_limite ?? "9999-12-31").localeCompare(String(right.data_limite ?? "9999-12-31"));
  });

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
    alwaysShow?: boolean;
    ctaHref?: string;
    ctaLabel?: string;
    emptyMessage?: string;
    listHref?: string;
    subtitle?: string;
    taskItems?: DashboardOperationalTaskItem[];
    totalValueLabel?: string;
  },
): DashboardOperationalSection => ({
  alwaysShow: options?.alwaysShow,
  count,
  ctaHref: options?.ctaHref,
  ctaLabel: options?.ctaLabel,
  emptyMessage: options?.emptyMessage ?? "Nada pendente nesta categoria.",
  id,
  items,
  listHref: options?.listHref,
  subtitle: options?.subtitle,
  taskItems: options?.taskItems,
  title,
  totalValueLabel: options?.totalValueLabel,
});

const joinSummaryParts = (parts: string[]): string => {
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} e ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")} e ${parts[parts.length - 1]}`;
};

export const buildOperationalSummaryLines = (summary: DashboardOperationalSummary): string[] => {
  const lines: string[] = [];

  if (summary.weekPartiesCount === 1) {
    lines.push("Esta semana você tem 1 festa para executar.");
  } else if (summary.weekPartiesCount > 1) {
    lines.push(`Esta semana você tem ${summary.weekPartiesCount} festas para executar.`);
  } else {
    lines.push("Esta semana você não tem festas para executar.");
  }

  const secondaryParts: string[] = [];

  if (summary.receivablesTotal > 0) {
    secondaryParts.push(`${currencyFormatter.format(summary.receivablesTotal)} a receber esta semana`);
  }

  if (summary.organizeCount === 1) {
    secondaryParts.push("1 festa para começar a organizar");
  } else if (summary.organizeCount > 1) {
    secondaryParts.push(`${summary.organizeCount} festas para começar a organizar`);
  }

  if (summary.pendingChecklistsCount === 1) {
    secondaryParts.push("1 checklist pendente");
  } else if (summary.pendingChecklistsCount > 1) {
    secondaryParts.push(`${summary.pendingChecklistsCount} checklists pendentes`);
  }

  if (secondaryParts.length > 0) {
    lines.push(`Também existem ${joinSummaryParts(secondaryParts)}.`);
  }

  return lines;
};

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
    .map((event) => mapEventToOperationalItem(event));

  const receivablesWithBalance = events
    .filter(
      (event) =>
        isActiveFesta(event) &&
        getEventOpenBalance(event, paidByEvent) > 0 &&
        shouldShowInReceivablesCard(event, weekRange.startDate, weekRange.endDate, todayIso),
    )
    .sort((left, right) => {
      const leftOverdue = isReceivableOverdue(left, todayIso);
      const rightOverdue = isReceivableOverdue(right, todayIso);
      if (leftOverdue !== rightOverdue) return leftOverdue ? -1 : 1;

      const leftDue = getReceivableDueDate(left) ?? "";
      const rightDue = getReceivableDueDate(right) ?? "";
      return leftDue.localeCompare(rightDue);
    });

  const receivables = receivablesWithBalance.map((event) => {
    const dueDate = getReceivableDueDate(event);

    return mapEventToOperationalItem(event, {
      dueDateLabel: dueDate ? formatOperationalPartyDateLabel(dueDate) : undefined,
      isOverdue: isReceivableOverdue(event, todayIso),
      valueLabel: currencyFormatter.format(getEventOpenBalance(event, paidByEvent)),
    });
  });

  const receivablesTotal = receivablesWithBalance.reduce(
    (sum, event) => sum + getEventOpenBalance(event, paidByEvent),
    0,
  );

  const pendingTarefas = tarefas.filter((tarefa) => !tarefa.concluida);
  const taskItems = sortPendingTarefas(pendingTarefas).map(mapTarefaToOperationalTaskItem);

  const organizeBoasVindas = events
    .filter((event) => isActiveFesta(event) && event.etapa === "boas_vindas")
    .sort((left, right) => String(left.data_evento ?? "").localeCompare(String(right.data_evento ?? "")))
    .map((event) => mapEventToOperationalItem(event));

  const startChecklist = events
    .filter((event) => {
      if (!isActiveFesta(event) || event.etapa !== "planejamento") return false;
      return parseChecklistConcluidos(event.checklist_concluidos).length === 0;
    })
    .sort((left, right) => String(left.data_evento ?? "").localeCompare(String(right.data_evento ?? "")))
    .map((event) => mapEventToOperationalItem(event));

  const finalizeChecklist = events
    .filter((event) => {
      if (!isActiveFesta(event) || event.etapa !== "planejamento") return false;
      if (!isDateInRange(event.data_evento, monthRange.startDate, monthRange.endDate)) return false;
      return parseChecklistConcluidos(event.checklist_concluidos).length > 0;
    })
    .sort((left, right) => String(left.data_evento ?? "").localeCompare(String(right.data_evento ?? "")))
    .map((event) => mapEventToOperationalItem(event));

  const sections: DashboardOperationalSection[] = [
    buildSection("week-parties", "Minha Semana", weekParties.length, weekParties, {
      emptyMessage: "Nenhuma festa confirmada para esta semana.",
      listHref: "/crm?funil=festa",
      subtitle:
        weekParties.length === 1
          ? "1 festa a ser executada"
          : `${weekParties.length} festas a serem executadas`,
    }),
    buildSection("receivables", "Valores a receber", receivables.length, receivables, {
      alwaysShow: true,
      emptyMessage: "Esta semana não temos valores a receber. Estamos com tudo em dia.",
      listHref: "/financeiro",
      subtitle:
        receivables.length === 0
          ? "Nenhum vencimento nesta semana"
          : receivables.length === 1
            ? `1 festa · ${currencyFormatter.format(receivablesTotal)}`
            : `${receivables.length} festas · ${currencyFormatter.format(receivablesTotal)}`,
      totalValueLabel: currencyFormatter.format(receivablesTotal),
    }),
    buildSection("organize-boas-vindas", "Começar a organizar", organizeBoasVindas.length, organizeBoasVindas, {
      emptyMessage: "Nenhuma festa aguardando organização em Boas Vindas.",
      listHref: "/crm?funil=festa&etapa=boas_vindas",
      subtitle:
        organizeBoasVindas.length === 1
          ? "1 festa em Boas Vindas"
          : `${organizeBoasVindas.length} festas em Boas Vindas`,
    }),
    buildSection("start-checklist", "Iniciar checklist", startChecklist.length, startChecklist, {
      emptyMessage: "Nenhuma festa aguardando o primeiro item do checklist.",
      listHref: "/crm?funil=festa&etapa=planejamento",
      subtitle:
        startChecklist.length === 1
          ? "1 festa em Planejamento sem checklist iniciado"
          : `${startChecklist.length} festas em Planejamento sem checklist iniciado`,
    }),
    buildSection("finalize-checklist", "Finalizar checklist", finalizeChecklist.length, finalizeChecklist, {
      emptyMessage: "Nenhuma festa do mês com checklist em andamento.",
      listHref: "/crm?funil=festa&etapa=planejamento",
      subtitle:
        finalizeChecklist.length === 1
          ? "1 festa do mês precisa concluir o checklist"
          : `${finalizeChecklist.length} festas do mês precisam concluir o checklist`,
    }),
    buildSection("tasks", "Tarefas", pendingTarefas.length, [], {
      alwaysShow: true,
      ctaHref: "/tarefas",
      ctaLabel: "Ir para as tarefas",
      emptyMessage: "Nenhuma tarefa pendente.",
      listHref: "/tarefas",
      subtitle:
        pendingTarefas.length === 1
          ? "1 tarefa precisa ser realizada"
          : `${pendingTarefas.length} tarefas precisam ser realizadas`,
      taskItems,
    }),
  ];

  const hasActions = sections.some((section) => section.count > 0);
  const summary: DashboardOperationalSummary = {
    organizeCount: organizeBoasVindas.length,
    pendingChecklistsCount: startChecklist.length + finalizeChecklist.length,
    receivablesTotal,
    weekPartiesCount: weekParties.length,
  };

  return {
    hasActions,
    sections,
    summary,
    summaryLines: buildOperationalSummaryLines(summary),
  };
};
