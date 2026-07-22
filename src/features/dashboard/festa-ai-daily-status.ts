import type { Evento } from "@/features/eventos";

export type FestaAiSectionId =
  | "contato-inicial"
  | "contratos"
  | "followup-comercial"
  | "propostas";

export interface FestaAiStatusSection {
  count: number;
  emptyMessage?: string;
  id: FestaAiSectionId;
  subtitle: string;
  title: string;
}

export interface FestaAiDailyStatus {
  sections: FestaAiStatusSection[];
}

const INACTIVE_STATUSES = new Set(["perdido", "cancelado"]);

const isActiveEvent = (event: Evento) => !INACTIVE_STATUSES.has(event.status_interno);

const isActiveVendasLead = (event: Evento) =>
  event.funil === "vendas" && event.status_interno !== "perdido";

const formatCountLabel = (count: number, singular: string, plural: string) =>
  `${count} ${count === 1 ? singular : plural}`;

export const isInComercialFollowupPipeline = (event: Evento): boolean => {
  if (event.funil !== "vendas" || !isActiveEvent(event)) return false;

  if (event.etapa === "contato_inicial") {
    return !event.followup_0b_enviado_em;
  }

  if (event.etapa === "proposta_enviada") {
    return event.followup_status === "ativo" || event.followup_status === "pausado_resposta";
  }

  return false;
};

export const buildFestaAiDailyStatus = (
  events: Evento[],
  contractSignatureEventoIds: number[],
): FestaAiDailyStatus => {
  const contatoInicialCount = events.filter(
    (event) => isActiveVendasLead(event) && event.etapa === "contato_inicial",
  ).length;

  const propostasEnviadasCount = events.filter(
    (event) => isActiveVendasLead(event) && event.etapa === "proposta_enviada",
  ).length;

  const contratosPendentesCount = contractSignatureEventoIds.length;
  const comercialFollowupCount = events.filter(isInComercialFollowupPipeline).length;

  const sections: FestaAiStatusSection[] = [
    {
      count: contatoInicialCount,
      emptyMessage: "Nenhum cliente em contato inicial no momento.",
      id: "contato-inicial",
      subtitle: `Estamos em etapa de contato inicial com ${formatCountLabel(contatoInicialCount, "cliente", "clientes")}`,
      title: "Contato inicial",
    },
    {
      count: propostasEnviadasCount,
      emptyMessage: "Nenhuma proposta aguardando retorno.",
      id: "propostas",
      subtitle: `${formatCountLabel(propostasEnviadasCount, "proposta", "propostas")} aguardando retorno`,
      title: "Propostas enviadas",
    },
    {
      count: contratosPendentesCount,
      emptyMessage: "Nenhum contrato pendente de assinatura.",
      id: "contratos",
      subtitle: `Temos ${formatCountLabel(contratosPendentesCount, "contrato", "contratos")} a serem assinados`,
      title: "Contratos pendentes",
    },
    {
      count: comercialFollowupCount,
      emptyMessage: "Nenhum cliente na esteira de follow-up comercial.",
      id: "followup-comercial",
      subtitle: `${formatCountLabel(comercialFollowupCount, "cliente", "clientes")} em processo de follow-up comercial`,
      title: "Follow-up comercial",
    },
  ];

  return { sections };
};
