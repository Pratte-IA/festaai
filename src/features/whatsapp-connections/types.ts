export type WhatsappConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

export interface WhatsappConnection {
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
  status: WhatsappConnectionStatus;
  tenant_id: number;
  type: string;
  updated_at: string;
  webhook_url: string | null;
}

export interface WhatsappConnectionsResponse {
  connections: WhatsappConnection[];
  ok: boolean;
}

export interface WhatsappConnectionResponse {
  connection: WhatsappConnection;
  ok: boolean;
}
