import type { DashboardAlert } from "./build-dashboard-alerts";
import type { Evento } from "@/features/eventos";
import type { TenantTarefaListItem } from "@/features/tarefas/types";
import { isTarefaOverdue } from "@/features/tarefas/filter-tenant-tarefas";
import { getTodayIsoDate } from "@/lib/date";
import {
  getTargetPartyDateForSeteDiasReminder,
  isSeteDiasAutomationActive,
  shouldSendSeteDiasReminder,
} from "./sete-dias-preview";

export type DashboardGuideItemKind = "tarefa" | "alerta" | "automacao";
export type DashboardGuideAlertType = "pendencia" | "prazo" | "contrato";

export interface DashboardGuideItem {
  alertType?: DashboardGuideAlertType;
  description: string;
  eventoId?: number;
  href?: string;
  id: string;
  kind: DashboardGuideItemKind;
  title: string;
}

export interface DashboardSystemSummary {
  contractSignatureReminders: number;
  propostaFollowups: number;
  satisfactionSurveys: number;
  seteDiasReminders: number;
}

const isTarefaDueToday = (tarefa: TenantTarefaListItem): boolean =>
  !tarefa.concluida && tarefa.data_limite === getTodayIsoDate();

const getTarefaEventLabel = (tarefa: TenantTarefaListItem) => {
  const evento = tarefa.evento;
  if (!evento) return "Evento removido";
  return evento.aniversariante_nome
    ? `${evento.cliente_nome} (${evento.aniversariante_nome})`
    : evento.cliente_nome;
};

const daysSince = (date: string) => {
  const dateValue = new Date(date).getTime();
  return Math.floor((Date.now() - dateValue) / (1000 * 60 * 60 * 24));
};

export const buildTodayUserActions = (
  tarefas: TenantTarefaListItem[],
  alerts: DashboardAlert[],
): DashboardGuideItem[] => {
  const pendingTarefas = tarefas
    .filter((tarefa) => !tarefa.concluida && (isTarefaOverdue(tarefa) || isTarefaDueToday(tarefa)))
    .sort((left, right) => {
      const leftOverdue = isTarefaOverdue(left);
      const rightOverdue = isTarefaOverdue(right);
      if (leftOverdue !== rightOverdue) return leftOverdue ? -1 : 1;
      return String(left.data_limite ?? "").localeCompare(String(right.data_limite ?? ""));
    })
    .slice(0, 4)
    .map<DashboardGuideItem>((tarefa) => ({
      description: isTarefaOverdue(tarefa)
        ? `Atrasada · ${getTarefaEventLabel(tarefa)}`
        : `Para hoje · ${getTarefaEventLabel(tarefa)}`,
      eventoId: tarefa.evento_id,
      href: "/tarefas",
      id: `tarefa-${tarefa.id}`,
      kind: "tarefa",
      title: tarefa.titulo,
    }));

  const alertItems = alerts.slice(0, Math.max(0, 5 - pendingTarefas.length)).map<DashboardGuideItem>((alert) => ({
    alertType: alert.type,
    description: alert.description,
    eventoId: alert.eventoId,
    id: `alerta-${alert.type}-${alert.eventoId}-${alert.description}`,
    kind: "alerta",
    title: alert.title,
  }));

  return [...pendingTarefas, ...alertItems];
};

export const buildTodaySystemSummary = (
  events: Evento[],
  pendingContractSignatures: number,
): DashboardSystemSummary => {
  const todayIso = getTodayIsoDate();

  const propostaFollowups = events.filter(
    (event) => event.etapa === "proposta_enviada" && daysSince(event.updated_at) >= 2,
  ).length;

  const seteDiasReminders = events.filter((event) => {
    if (event.funil !== "festa" || event.status_interno !== "ativo") return false;
    if (event.sete_dias_whatsapp_enviado_em) return false;
    if (!event.data_evento) return false;
    return shouldSendSeteDiasReminder(event.data_evento, todayIso);
  }).length;

  const satisfactionSurveys = events.filter((event) => event.etapa === "aguardando_feedback").length;

  return {
    contractSignatureReminders: pendingContractSignatures,
    propostaFollowups,
    satisfactionSurveys,
    seteDiasReminders: isSeteDiasAutomationActive(todayIso) ? seteDiasReminders : 0,
  };
};

export const buildTodaySystemActions = (summary: DashboardSystemSummary): DashboardGuideItem[] => {
  const items: DashboardGuideItem[] = [];

  if (summary.propostaFollowups > 0) {
    items.push({
      description:
        summary.propostaFollowups === 1
          ? "1 lead em proposta enviada receberá follow-up automático"
          : `${summary.propostaFollowups} leads em proposta enviada receberão follow-up automático`,
      id: "automacao-proposta-followup",
      kind: "automacao",
      title: "Follow-up de proposta",
    });
  }

  if (summary.contractSignatureReminders > 0) {
    items.push({
      description:
        summary.contractSignatureReminders === 1
          ? "1 contrato aguardando assinatura receberá lembrete"
          : `${summary.contractSignatureReminders} contratos aguardando assinatura receberão lembrete`,
      id: "automacao-assinatura-contrato",
      kind: "automacao",
      title: "Follow-up de assinatura",
    });
  }

  if (summary.seteDiasReminders > 0) {
    const targetDate = getTargetPartyDateForSeteDiasReminder();
    items.push({
      description:
        summary.seteDiasReminders === 1
          ? `1 festa em ${targetDate} receberá lembrete de 7 dias`
          : `${summary.seteDiasReminders} festas em ${targetDate} receberão lembrete de 7 dias`,
      id: "automacao-sete-dias",
      kind: "automacao",
      title: "7 dias antes da festa",
    });
  }

  if (summary.satisfactionSurveys > 0) {
    items.push({
      description:
        summary.satisfactionSurveys === 1
          ? "1 pesquisa de satisfação será enviada automaticamente"
          : `${summary.satisfactionSurveys} pesquisas de satisfação serão enviadas automaticamente`,
      id: "automacao-pesquisa-satisfacao",
      kind: "automacao",
      title: "Pesquisa de satisfação",
    });
  }

  items.push({
    description: "Responde mensagens e conduz o atendimento comercial no WhatsApp",
    id: "automacao-atendimento",
    kind: "automacao",
    title: "Atendimento automático",
  });

  return items;
};
