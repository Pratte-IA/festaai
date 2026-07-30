export type PlatformWhatsappStage =
  | "contato_inicial"
  | "em_conversa"
  | "demonstracao_agendada"
  | "proposta_enviada"
  | "perdido";

export type WhatsappConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

export type WhatsappConnectionScope = "tenant" | "platform";

export interface PlatformWhatsappConnection {
  created_at: string;
  created_by: string | null;
  id: number;
  instance_name: string;
  last_error: string | null;
  last_seen_at: string | null;
  name: string;
  phone: string | null;
  provider: string;
  qr_code: string | null;
  scope: WhatsappConnectionScope;
  status: WhatsappConnectionStatus;
  tenant_id: number | null;
  type: string;
  updated_at: string;
  webhook_url: string | null;
}

export interface PlatformWhatsappConversation {
  avatar_fetched_at: string | null;
  avatar_url: string | null;
  connection_id: number;
  created_at: string;
  customer_name: string | null;
  customer_phone: string;
  id: number;
  is_unread: boolean;
  last_message_at: string | null;
  last_message_preview: string | null;
  lost_reason: string | null;
  stage: PlatformWhatsappStage;
  updated_at: string;
}

export interface PlatformWhatsappMessage {
  body: string | null;
  connection_id: number;
  conversation_id: number;
  created_at: string;
  direction: "inbound" | "outbound";
  evolution_message_id: string | null;
  from_me: boolean;
  id: number;
  message_type: string;
  sent_at: string;
}

/** Contato aberto do CRM sem card no funil (ainda não houve mensagem). */
export interface PlatformWhatsappDraft {
  connection_id: number;
  customer_name: string | null;
  customer_phone: string;
  /** ID em radar.market_companies quando veio do CRM. */
  radar_company_id?: number | null;
}

export const PLATFORM_WHATSAPP_STAGES: PlatformWhatsappStage[] = [
  "contato_inicial",
  "em_conversa",
  "demonstracao_agendada",
  "proposta_enviada",
  "perdido",
];

export const PLATFORM_WHATSAPP_STAGE_LABELS: Record<PlatformWhatsappStage, string> = {
  contato_inicial: "Contato Inicial",
  em_conversa: "Em conversa",
  demonstracao_agendada: "Demonstração agendada",
  proposta_enviada: "Proposta Enviada",
  perdido: "Perdido",
};
