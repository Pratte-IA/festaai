export const N8N_PAYLOAD_VERSION = 1;

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

const parseTimeoutMs = () => {
  const raw = Deno.env.get("N8N_FORWARD_TIMEOUT_MS");
  const parsed = raw ? Number.parseInt(raw, 10) : 5000;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5000;
};

export const forwardToN8n = async (
  payload: N8nInboundPayload,
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
  const timeoutMs = payload.message.mediaBase64
    ? Math.max(parseTimeoutMs(), 30000)
    : parseTimeoutMs();
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
  version: N8N_PAYLOAD_VERSION,
});

/** Payload resumido para persistência em logs (sem raw completo). */
export const buildLogPayload = (payload: N8nInboundPayload) => ({
  connection: payload.connection,
  event: payload.event,
  message: {
    customerPhone: payload.message.customerPhone,
    hasMediaBase64: Boolean(payload.message.mediaBase64),
    id: payload.message.id,
    mediaMimetype: payload.message.mediaMimetype,
    type: payload.message.type,
  },
  tenant: payload.tenant,
  version: payload.version,
});
