/** Versão genérica de payloads outbound (boas-vindas, sete-dias, etc.). */
export const N8N_PAYLOAD_VERSION = 1;

/**
 * Versão do contrato inbound messages.upsert.
 * v2: inclui message.replyTo (mensagem citada/respondida).
 */
export const N8N_INBOUND_PAYLOAD_VERSION = 2;

export interface N8nReplyTo {
  id: string | null;
  text: string | null;
  type: string | null;
  participant: string | null;
}

export interface N8nInboundPayload {
  connection: {
    id: number;
    instanceName: string;
    name: string;
    phone: string | null;
  };
  event: string;
  message: {
    customerName: string | null;
    customerPhone: string;
    fromMe: boolean;
    id: string | null;
    mediaBase64: string | null;
    mediaMimetype: string | null;
    replyTo: N8nReplyTo | null;
    text: string;
    timestamp: string | null;
    type: string;
  };
  source: "festaai";
  tenant: {
    id: number;
    slug: string;
  };
  version: number;
}

export interface N8nForwardResult {
  errorMessage: string | null;
  ok: boolean;
  responseStatus: number | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseTimeoutMs = () => {
  const raw = Deno.env.get("N8N_FORWARD_TIMEOUT_MS");
  const parsed = raw ? Number.parseInt(raw, 10) : 5000;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5000;
};

export const forwardToN8n = async (
  payload: N8nInboundPayload | Record<string, unknown>,
  webhookUrl: string,
): Promise<N8nForwardResult> => {
  const secret = Deno.env.get("N8N_WEBHOOK_SECRET");

  if (!webhookUrl) {
    return {
      errorMessage: "URL do webhook N8N do tenant não configurada.",
      ok: false,
      responseStatus: null,
    };
  }

  if (!secret) {
    return {
      errorMessage: "N8N_WEBHOOK_SECRET não configurado.",
      ok: false,
      responseStatus: null,
    };
  }

  const controller = new AbortController();
  const hasMediaBase64 =
    "message" in payload &&
    isRecord(payload.message) &&
    typeof payload.message.mediaBase64 === "string" &&
    payload.message.mediaBase64.length > 0;
  const timeoutMs = hasMediaBase64 ? Math.max(parseTimeoutMs(), 30000) : parseTimeoutMs();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(webhookUrl, {
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        "x-n8n-webhook-secret": secret,
      },
      method: "POST",
      signal: controller.signal,
    });

    if (!response.ok) {
      const bodyText = await response.text().catch(() => "");
      return {
        errorMessage: bodyText || `N8N respondeu com status ${response.status}.`,
        ok: false,
        responseStatus: response.status,
      };
    }

    return {
      errorMessage: null,
      ok: true,
      responseStatus: response.status,
    };
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "Timeout ao encaminhar para o N8N."
        : error instanceof Error
          ? error.message
          : "Falha ao encaminhar para o N8N.";

    return {
      errorMessage: message,
      ok: false,
      responseStatus: null,
    };
  } finally {
    clearTimeout(timeout);
  }
};

export const buildN8nInboundPayload = (input: {
  connection: {
    id: number;
    instance_name: string;
    name: string;
    phone: string | null;
  };
  event: string;
  message: {
    customerName: string | null;
    customerPhone: string;
    fromMe: boolean;
    id: string | null;
    mediaBase64: string | null;
    mediaMimetype: string | null;
    replyTo: N8nReplyTo | null;
    text: string;
    timestamp: string | null;
    type: string;
  };
  tenant: {
    id: number;
    slug: string;
  };
}): N8nInboundPayload => ({
  connection: {
    id: input.connection.id,
    instanceName: input.connection.instance_name,
    name: input.connection.name,
    phone: input.connection.phone,
  },
  event: input.event,
  message: input.message,
  source: "festaai",
  tenant: {
    id: input.tenant.id,
    slug: input.tenant.slug,
  },
  version: N8N_INBOUND_PAYLOAD_VERSION,
});

/** Payload resumido para persistência em logs (sem raw completo / sem PII de texto). */
export const buildLogPayload = (payload: N8nInboundPayload) => ({
  connection: payload.connection,
  event: payload.event,
  message: {
    customerPhone: payload.message.customerPhone,
    fromMe: payload.message.fromMe,
    hasMediaBase64: Boolean(payload.message.mediaBase64),
    hasReplyTo: Boolean(payload.message.replyTo),
    id: payload.message.id,
    mediaMimetype: payload.message.mediaMimetype,
    replyToId: payload.message.replyTo?.id ?? null,
    type: payload.message.type,
  },
  tenant: payload.tenant,
  version: payload.version,
});
