import { useQuery } from "@tanstack/react-query";

import { buildNeedsAttention, type NeedsAttention } from "./build-needs-attention";
import { countNewLeadsToday } from "./count-new-leads-today";
import { sumFestaOpenBalance, sumFestaOverdueOpenBalance } from "./festa-open-balance";
import { buildMonthRevenueBreakdown } from "./month-revenue";
import {
  buildCommercialActivity,
  countNewLeadsThisMonth,
  getClosedPartiesWithSignedContractInRange,
  type CommercialActivity,
  type SignedContractClosing,
} from "./commercial-activity";
import { buildFestaAiDailyStatus, type FestaAiDailyStatus } from "./festa-ai-daily-status";
import { buildOperationalGuide, type DashboardOperationalGuide } from "./operational-guide";
import { Evento, EventoPagamento } from "@/features/eventos";
import type { TenantTarefaEvento, TenantTarefaListItem } from "@/features/tarefas/types";
import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";
import { parseIsoDateLocal } from "@/lib/date";

export type { NeedsAttention } from "./build-needs-attention";

export interface DashboardParty {
  date: string;
  id: number;
  client: string;
  status: string;
  statusColor: string;
  value: string;
}

interface DashboardTarefaRow {
  assigned_to: string | null;
  concluida: boolean;
  created_at: string;
  created_by: string | null;
  data_limite: string | null;
  evento_id: number;
  eventos: TenantTarefaEvento | TenantTarefaEvento[] | null;
  id: number;
  ordem: number;
  tenant_id: number;
  titulo: string;
  updated_at: string;
  updated_by: string | null;
}

interface DashboardData {
  needsAttention: NeedsAttention;
  commercialActivity: CommercialActivity;
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
  operationalGuide: DashboardOperationalGuide;
  festaAiDailyStatus: FestaAiDailyStatus;
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

  if (evento.etapa === "planejamento") {
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

const shortDate = (date: string) => {
  const parsed = parseIsoDateLocal(date);
  if (!parsed) return date;

  return shortDateFormatter.format(parsed).replace(".", "");
};

const mapDashboardTarefa = (row: DashboardTarefaRow): TenantTarefaListItem => {
  const evento = Array.isArray(row.eventos) ? (row.eventos[0] ?? null) : row.eventos;

  return {
    assigned_to: row.assigned_to,
    concluida: row.concluida,
    created_at: row.created_at,
    created_by: row.created_by,
    data_limite: row.data_limite,
    evento,
    evento_id: row.evento_id,
    id: row.id,
    ordem: row.ordem,
    responsavelNome: "Usuario",
    tenant_id: row.tenant_id,
    titulo: row.titulo,
    updated_at: row.updated_at,
    updated_by: row.updated_by,
  };
};

const fetchDashboardData = async (tenantId: number): Promise<DashboardData> => {
  const { startIso, endIso, startDate, endDate } = getMonthRange();

  const [eventsResult, paymentsResult, tarefasResult, contractsResult, acceptedContractsResult] =
    await Promise.all([
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
    supabase
      .from("evento_tarefas")
      .select(
        `
          id,
          tenant_id,
          evento_id,
          titulo,
          concluida,
          ordem,
          data_limite,
          assigned_to,
          created_at,
          updated_at,
          created_by,
          updated_by,
          eventos (
            id,
            cliente_nome,
            aniversariante_nome,
            data_evento
          )
        `,
      )
      .eq("tenant_id", tenantId)
      .returns<DashboardTarefaRow[]>(),
    supabase
      .from("evento_contracts")
      .select("id, evento_id")
      .eq("tenant_id", tenantId)
      .eq("status", "generated")
      .eq("assinatura_followup_status", "ativo"),
    supabase
      .from("evento_contracts")
      .select("evento_id, accepted_at")
      .eq("tenant_id", tenantId)
      .eq("status", "accepted")
      .not("accepted_at", "is", null)
      .returns<SignedContractClosing[]>(),
  ]);

  if (eventsResult.error) {
    throw eventsResult.error;
  }

  if (paymentsResult.error) {
    throw paymentsResult.error;
  }

  if (tarefasResult.error) {
    throw tarefasResult.error;
  }

  if (contractsResult.error) {
    throw contractsResult.error;
  }

  if (acceptedContractsResult.error) {
    throw acceptedContractsResult.error;
  }

  const events = eventsResult.data ?? [];
  const payments = paymentsResult.data ?? [];
  const tarefas = (tarefasResult.data ?? []).map(mapDashboardTarefa);
  const contractSignatureEventoIds = (contractsResult.data ?? []).map((contract) => contract.evento_id);
  const signedContracts = (acceptedContractsResult.data ?? []).filter(
    (contract): contract is SignedContractClosing => Boolean(contract.accepted_at),
  );
  const closedThisMonth = getClosedPartiesWithSignedContractInRange(
    events,
    signedContracts,
    startIso,
    endIso,
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

  const operationalGuide = buildOperationalGuide(events, payments, tarefas);
  const festaAiDailyStatus = buildFestaAiDailyStatus(events, contractSignatureEventoIds);
  const commercialActivity = buildCommercialActivity(events, signedContracts);
  const needsAttention = buildNeedsAttention(events, payments);
  const leadsThisMonth = countNewLeadsThisMonth(events);

  return {
    needsAttention,
    commercialActivity,
    metrics: {
      closedParties: closedThisMonth.length,
      conversionRate:
        leadsThisMonth > 0 ? Math.round((closedThisMonth.length / leadsThisMonth) * 100) : 0,
      feedbackPending: events.filter((event) => event.etapa === "aguardando_feedback").length,
      futureOpportunities: events.filter((event) => event.etapa === "oportunidade_futura").length,
      leadsInPeriod: leadsThisMonth,
      newLeadsToday: countNewLeadsToday(events),
      monthRevenue,
      monthFestaEntradas,
      monthPaymentsReceived,
      pendingBalance,
      socialMediaClients: events.filter((event) => event.etapa === "redes_sociais").length,
      soldValue: closedThisMonth.reduce((sum, event) => sum + event.valor_total, 0),
      toReceive,
    },
    festaAiDailyStatus,
    operationalGuide,
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
