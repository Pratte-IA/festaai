import { useQuery } from "@tanstack/react-query";

import { countNewLeadsToday } from "./count-new-leads-today";
import { sumFestaOpenBalance, sumFestaOverdueOpenBalance } from "./festa-open-balance";
import { buildMonthRevenueBreakdown } from "./month-revenue";
import { Evento, EventoPagamento } from "@/features/eventos";
import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";
import { isIsoDateBeforeToday, parseIsoDateLocal } from "@/lib/date";

type AlertType = "pendencia" | "prazo" | "contrato";

export interface DashboardAlert {
  description: string;
  eventoId: number;
  title: string;
  type: AlertType;
}

export interface DashboardParty {
  date: string;
  id: number;
  client: string;
  status: string;
  statusColor: string;
  value: string;
}

interface DashboardData {
  alerts: DashboardAlert[];
  metrics: {
    closedParties: number;
    conversionRate: number;
    feedbackPending: number;
    leadsInPeriod: number;
    newLeadsToday: number;
    monthRevenue: number;
    monthFestaEntradas: number;
    monthPaymentsReceived: number;
    pendingBalance: number;
    socialMediaClients: number;
    soldValue: number;
    toReceive: number;
    futureOpportunities: number;
  };
  upcomingParties: DashboardParty[];
}

const dashboardQueryKeys = {
  data: (tenantId: number | null) => ["dashboard", tenantId, "data"] as const,
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  maximumFractionDigits: 0,
  style: "currency",
});

const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
});

const getMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const toIsoDate = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  return {
    endDate: toIsoDate(end),
    endIso: end.toISOString(),
    startDate: toIsoDate(start),
    startIso: start.toISOString(),
  };
};

const getStatusLabel = (evento: Evento) => {
  if (evento.etapa === "perdido" || evento.status_interno === "perdido") {
    return {
      label: "Perdido",
      statusColor: "bg-destructive/15 text-destructive",
    };
  }

  if (evento.etapa === "contrato" || evento.etapa === "planejamento") {
    return {
      label: "Planejando",
      statusColor: "bg-primary/15 text-primary",
    };
  }

  if (evento.funil === "festa" || evento.funil === "executadas") {
    return {
      label: "Confirmado",
      statusColor: "bg-success/15 text-success",
    };
  }

  return {
    label: "Pendente",
    statusColor: "bg-warning/15 text-warning",
  };
};

const daysSince = (date: string) => {
  const dateValue = new Date(date).getTime();
  return Math.floor((Date.now() - dateValue) / (1000 * 60 * 60 * 24));
};

const buildAlerts = (events: Evento[], payments: EventoPagamento[]): DashboardAlert[] => {
  const paidByEvent = new Map<number, number>();

  payments.forEach((payment) => {
    paidByEvent.set(payment.evento_id, (paidByEvent.get(payment.evento_id) ?? 0) + payment.valor);
  });

  const alerts: DashboardAlert[] = [];

  events.forEach((event) => {
    const eventTitle = `${event.cliente_nome}${event.data_evento ? ` - Festa ${shortDate(event.data_evento)}` : ""}`;

    if (event.etapa === "proposta_enviada" && daysSince(event.updated_at) >= 3) {
      alerts.push({
        description: "Proposta enviada sem retorno ha 3 dias ou mais",
        eventoId: event.id,
        title: eventTitle,
        type: "pendencia",
      });
    }

    if (event.etapa === "contrato") {
      alerts.push({
        description: "Contrato pendente de assinatura ou conferencia",
        eventoId: event.id,
        title: eventTitle,
        type: "contrato",
      });
    }

    const paid = event.valor_entrada + (paidByEvent.get(event.id) ?? 0);
    if (event.valor_total > paid && event.data_evento && isIsoDateBeforeToday(event.data_evento)) {
      alerts.push({
        description: "Saldo pendente em evento com data ja vencida",
        eventoId: event.id,
        title: eventTitle,
        type: "prazo",
      });
    }

    if (event.etapa === "aguardando_feedback") {
      alerts.push({
        description: "Feedback pos-festa pendente",
        eventoId: event.id,
        title: eventTitle,
        type: "pendencia",
      });
    }
  });

  return alerts.slice(0, 5);
};

const shortDate = (date: string) => {
  const parsed = parseIsoDateLocal(date);
  if (!parsed) return date;

  return shortDateFormatter.format(parsed).replace(".", "");
};

const fetchDashboardData = async (tenantId: number): Promise<DashboardData> => {
  const { startIso, endIso, startDate, endDate } = getMonthRange();

  const [eventsResult, paymentsResult] = await Promise.all([
    supabase
      .from("eventos")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("data_evento", { ascending: true })
      .returns<Evento[]>(),
    supabase
      .from("evento_pagamentos")
      .select("*")
      .eq("tenant_id", tenantId)
      .returns<EventoPagamento[]>(),
  ]);

  if (eventsResult.error) {
    throw eventsResult.error;
  }

  if (paymentsResult.error) {
    throw paymentsResult.error;
  }

  const events = eventsResult.data ?? [];
  const payments = paymentsResult.data ?? [];
  const monthEvents = events.filter((event) => event.created_at >= startIso && event.created_at <= endIso);
  const closedEvents = monthEvents.filter(
    (event) => event.funil === "festa" || event.funil === "executadas",
  );
  const paidByEvent = new Map<number, number>();

  payments.forEach((payment) => {
    paidByEvent.set(payment.evento_id, (paidByEvent.get(payment.evento_id) ?? 0) + payment.valor);
  });

  const monthRange = { startIso, endIso, startDate, endDate };
  const { monthFestaEntradas, monthPaymentsReceived, monthRevenue } = buildMonthRevenueBreakdown(
    events,
    payments,
    monthRange,
  );
  const toReceive = sumFestaOpenBalance(events, paidByEvent);
  const pendingBalance = sumFestaOverdueOpenBalance(events, paidByEvent);
  const upcomingParties = events
    .filter((event) => event.tipo_evento === "festa" && event.data_evento && event.data_evento >= startDate)
    .sort((left, right) => String(left.data_evento).localeCompare(String(right.data_evento)))
    .slice(0, 5)
    .map((event) => {
      const status = getStatusLabel(event);

      return {
        client: event.cliente_nome,
        date: event.data_evento ? shortDate(event.data_evento) : "Sem data",
        id: event.id,
        status: status.label,
        statusColor: status.statusColor,
        value: currencyFormatter.format(event.valor_total),
      };
    });

  return {
    alerts: buildAlerts(events, payments),
    metrics: {
      closedParties: closedEvents.length,
      conversionRate:
        monthEvents.length > 0 ? Math.round((closedEvents.length / monthEvents.length) * 100) : 0,
      feedbackPending: events.filter((event) => event.etapa === "aguardando_feedback").length,
      futureOpportunities: events.filter((event) => event.etapa === "oportunidade_futura").length,
      leadsInPeriod: monthEvents.length,
      newLeadsToday: countNewLeadsToday(events),
      monthRevenue,
      monthFestaEntradas,
      monthPaymentsReceived,
      pendingBalance,
      socialMediaClients: events.filter((event) => event.etapa === "redes_sociais").length,
      soldValue: closedEvents.reduce((sum, event) => sum + event.valor_total, 0),
      toReceive,
    },
    upcomingParties,
  };
};

export const useDashboardData = () => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(currentTenantId),
    queryFn: () => fetchDashboardData(currentTenantId as number),
    queryKey: dashboardQueryKeys.data(currentTenantId),
    staleTime: 1000 * 30,
  });
};
