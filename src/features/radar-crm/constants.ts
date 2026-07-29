export const CRM_STATUSES = [
  "new_lead",
  "qualifying",
  "contact_started",
  "in_conversation",
  "demo_scheduled",
  "proposal_sent",
  "negotiating",
  "won",
  "lost",
] as const;

export const CRM_STATUS_LABELS: Record<(typeof CRM_STATUSES)[number], string> = {
  new_lead: "Novo lead",
  qualifying: "Em qualificação",
  contact_started: "Contato iniciado",
  in_conversation: "Em conversa",
  demo_scheduled: "Demonstração agendada",
  proposal_sent: "Proposta enviada",
  negotiating: "Em negociação",
  won: "Fechado",
  lost: "Perdido",
};

/** Colunas do Kanban do CRM Comercial (todas as etapas do funil). */
export const CRM_KANBAN_STATUSES = CRM_STATUSES;

export const CRM_PRIORITIES = ["high", "medium", "low"] as const;

export const CRM_PRIORITY_LABELS: Record<(typeof CRM_PRIORITIES)[number], string> = {
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};

export const INTERACTION_TYPES = [
  "whatsapp",
  "phone",
  "instagram",
  "email",
  "meeting",
  "note",
  "other",
] as const;

export const INTERACTION_TYPE_LABELS: Record<(typeof INTERACTION_TYPES)[number], string> = {
  whatsapp: "WhatsApp",
  phone: "Ligação",
  instagram: "Instagram",
  email: "E-mail",
  meeting: "Reunião",
  note: "Observação",
  other: "Outro",
};

export const LOST_REASONS = [
  { value: "no_interest", label: "Sem interesse" },
  { value: "price", label: "Preço" },
  { value: "has_system", label: "Já possui sistema" },
  { value: "not_now", label: "Não é o momento" },
  { value: "no_response", label: "Não respondeu" },
  { value: "no_budget", label: "Sem orçamento" },
  { value: "bad_fit", label: "Não é o perfil ideal" },
  { value: "competitor", label: "Escolheu concorrente" },
  { value: "decided_against", label: "Decidiu não avançar" },
  { value: "other", label: "Outro" },
] as const;

export const DEFAULT_PAGE_SIZE = 25;
