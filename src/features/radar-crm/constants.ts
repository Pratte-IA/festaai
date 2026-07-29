export const CRM_STATUSES = [
  "new",
  "prospecting",
  "contacted",
  "responded",
  "meeting_scheduled",
  "proposal_sent",
  "won",
  "lost",
  "do_not_contact",
] as const;

export const CRM_STATUS_LABELS: Record<(typeof CRM_STATUSES)[number], string> = {
  new: "Novo",
  prospecting: "Em prospecção",
  contacted: "Contato realizado",
  responded: "Respondeu",
  meeting_scheduled: "Reunião agendada",
  proposal_sent: "Proposta enviada",
  won: "Ganho",
  lost: "Perdido",
  do_not_contact: "Não contatar",
};

/** Colunas do Kanban (sem "Não contatar", que fica como filtro/status especial). */
export const CRM_KANBAN_STATUSES = [
  "new",
  "prospecting",
  "contacted",
  "responded",
  "meeting_scheduled",
  "proposal_sent",
  "won",
  "lost",
] as const;

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

export const DEFAULT_PAGE_SIZE = 25;
