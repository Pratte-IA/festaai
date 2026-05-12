import { z } from "zod";

export const AGENT_REQUEST_TYPE_VALUES = [
  "text_adjustment",
  "info_update",
  "new_faq",
  "flow_change",
  "commercial_rule",
  "automation_integration",
  "other",
] as const;

export const AGENT_IMPACT_AREA_VALUES = [
  "initial_support",
  "quote",
  "packages",
  "schedule",
  "after_sales",
  "faq",
  "other",
] as const;

export const AGENT_URGENCY_VALUES = ["low", "normal", "high"] as const;

export const AGENT_STATUS_VALUES = [
  "pending",
  "in_review",
  "waiting_client",
  "quoted",
  "approved",
  "in_progress",
  "completed",
  "rejected",
] as const;

export const AGENT_BILLING_STATUS_VALUES = [
  "not_defined",
  "included",
  "billable",
  "billed",
  "waived",
] as const;

export type AgentRequestType = (typeof AGENT_REQUEST_TYPE_VALUES)[number];
export type AgentImpactArea = (typeof AGENT_IMPACT_AREA_VALUES)[number];
export type AgentUrgency = (typeof AGENT_URGENCY_VALUES)[number];
export type AgentStatus = (typeof AGENT_STATUS_VALUES)[number];
export type AgentBillingStatus = (typeof AGENT_BILLING_STATUS_VALUES)[number];

export const agentRequestTypeLabels: Record<AgentRequestType, string> = {
  text_adjustment: "Ajuste simples de texto",
  info_update: "Atualização de informação",
  new_faq: "Nova pergunta frequente",
  flow_change: "Mudança em fluxo de atendimento",
  commercial_rule: "Nova regra comercial",
  automation_integration: "Automação/integração",
  other: "Outro",
};

export const agentImpactAreaLabels: Record<AgentImpactArea, string> = {
  initial_support: "Atendimento inicial",
  quote: "Orçamento",
  packages: "Pacotes",
  schedule: "Agenda",
  after_sales: "Pós-venda",
  faq: "Dúvidas frequentes",
  other: "Outro",
};

export const agentUrgencyLabels: Record<AgentUrgency, string> = {
  low: "Baixa",
  normal: "Normal",
  high: "Alta",
};

export const agentStatusLabels: Record<AgentStatus, string> = {
  pending: "Pendente",
  in_review: "Em análise",
  waiting_client: "Aguardando cliente",
  quoted: "Orçamento enviado",
  approved: "Aprovado pelo cliente",
  in_progress: "Em implementação",
  completed: "Concluído",
  rejected: "Recusado",
};

export const agentBillingStatusLabels: Record<AgentBillingStatus, string> = {
  not_defined: "A definir",
  included: "Incluso",
  billable: "Cobrado à parte",
  billed: "Faturado",
  waived: "Isento",
};

export const LEGAL_NOTICE =
  "A configuração inicial do agente está inclusa na implantação. Pequenos ajustes poderão estar inclusos conforme o contrato. Alterações estruturais serão analisadas e poderão gerar orçamento adicional.";

export const agentChangeRequestInsertSchema = z.object({
  title: z.string().trim().min(3, "Informe um título (mínimo 3 caracteres)").max(200),
  request_type: z.enum(AGENT_REQUEST_TYPE_VALUES),
  impact_area: z.enum(AGENT_IMPACT_AREA_VALUES).optional(),
  description: z.string().trim().min(10, "Descreva o pedido com pelo menos 10 caracteres").max(8000),
  desired_example: z.string().trim().max(4000).optional(),
  urgency: z.enum(AGENT_URGENCY_VALUES),
});

export type AgentChangeRequestInsertValues = z.infer<typeof agentChangeRequestInsertSchema>;
