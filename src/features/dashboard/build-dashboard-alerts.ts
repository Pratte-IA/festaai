import type { Evento, EventoPagamento } from "@/features/eventos";
import { parseIsoDateLocal, toLocalIsoDateKey } from "@/lib/date";

import { getEventOpenBalance, isFestaWithOpenBalance } from "./festa-open-balance";
import { isReceivableOverdue } from "./receivable-due-window";

export type AlertType = "pendencia" | "prazo" | "contrato";

export interface DashboardAlert {
  description: string;
  eventoId: number;
  title: string;
  type: AlertType;
}

const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
});

const shortDate = (date: string) => {
  const parsed = parseIsoDateLocal(date);
  if (!parsed) return date;

  return shortDateFormatter.format(parsed).replace(".", "");
};

const alertPriority: Record<AlertType, number> = {
  contrato: 1,
  pendencia: 2,
  prazo: 0,
};

/** Proposta parada sem a esteira automática do FestaAI cuidando. */
export const isStalePropostaWithoutActiveFollowup = (event: Evento, referenceNow = Date.now()) => {
  if (event.funil !== "vendas" || event.etapa !== "proposta_enviada") return false;
  if (event.status_interno === "perdido" || event.status_interno === "cancelado") return false;
  if (event.followup_status === "ativo" || event.followup_status === "pausado_resposta") return false;

  const updatedMs = new Date(event.updated_at).getTime();
  if (!Number.isFinite(updatedMs)) return false;

  const days = Math.floor((referenceNow - updatedMs) / (1000 * 60 * 60 * 24));
  return days >= 3;
};

export const buildDashboardAlerts = (
  events: Evento[],
  payments: EventoPagamento[],
  options?: { limit?: number; referenceDate?: Date },
): DashboardAlert[] => {
  const limit = options?.limit ?? 5;
  const referenceDate = options?.referenceDate ?? new Date();
  const todayIso = toLocalIsoDateKey(referenceDate);
  const referenceNow = referenceDate.getTime();

  const paidByEvent = new Map<number, number>();
  payments.forEach((payment) => {
    paidByEvent.set(payment.evento_id, (paidByEvent.get(payment.evento_id) ?? 0) + payment.valor);
  });

  const alerts: DashboardAlert[] = [];

  events.forEach((event) => {
    const eventTitle = `${event.cliente_nome}${event.data_evento ? ` - Festa ${shortDate(event.data_evento)}` : ""}`;

    if (isStalePropostaWithoutActiveFollowup(event, referenceNow)) {
      alerts.push({
        description: "Proposta enviada sem retorno ha 3 dias ou mais",
        eventoId: event.id,
        title: eventTitle,
        type: "pendencia",
      });
    }

    if (
      isFestaWithOpenBalance(event, paidByEvent) &&
      isReceivableOverdue(event, todayIso) &&
      getEventOpenBalance(event, paidByEvent) > 0
    ) {
      alerts.push({
        description: "Saldo pendente com vencimento ja ultrapassado",
        eventoId: event.id,
        title: eventTitle,
        type: "prazo",
      });
    }

    if (event.etapa === "aguardando_feedback" && event.status_interno !== "cancelado") {
      alerts.push({
        description: "Feedback pos-festa pendente",
        eventoId: event.id,
        title: eventTitle,
        type: "pendencia",
      });
    }
  });

  return alerts
    .sort((left, right) => {
      const byType = alertPriority[left.type] - alertPriority[right.type];
      if (byType !== 0) return byType;
      return left.title.localeCompare(right.title, "pt-BR");
    })
    .slice(0, limit);
};
