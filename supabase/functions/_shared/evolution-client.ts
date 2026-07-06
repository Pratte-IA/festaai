export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

export const generateWebhookToken = () => crypto.randomUUID().replace(/-/g, "");

const requiredEnv = (key: string) => {
  const value = Deno.env.get(key);
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

export const getEvolutionBaseUrl = () => {
  const base =
    Deno.env.get("EVOLUTION_API_BASE_URL") ??
    Deno.env.get("EVOLUTION_API_URL") ??
    "";
  if (!base) {
    throw new Error("Missing required environment variable: EVOLUTION_API_BASE_URL");
  }
  return base.replace(/\/$/, "");
};

export const evolutionHeaders = () => {
  const apiKey = requiredEnv("EVOLUTION_API_KEY");
  return {
    Authorization: `Bearer ${apiKey}`,
    apikey: apiKey,
    "x-api-key": apiKey,
    "Content-Type": "application/json",
  };
};

export interface EvolutionFetchResult {
  ok: boolean;
  status: number;
  body: Record<string, unknown> | null;
  raw: string;
}

export const evolutionFetch = async (
  path: string,
  init?: RequestInit,
  timeoutMs = 15000,
): Promise<EvolutionFetchResult> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${getEvolutionBaseUrl()}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        ...evolutionHeaders(),
        ...(init?.headers ?? {}),
      },
    });

    const raw = await response.text();
    let body: Record<string, unknown> | null = null;

    if (raw) {
      try {
        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed === "object" && parsed !== null) {
          body = parsed as Record<string, unknown>;
        } else {
          body = { value: parsed };
        }
      } catch {
        body = { raw };
      }
    }

    return { ok: response.ok, status: response.status, body, raw };
  } finally {
    clearTimeout(timeout);
  }
};

export const mapEvolutionStateToStatus = (state: string | undefined): ConnectionStatus => {
  if (state === "open") return "connected";
  if (state === "close") return "disconnected";
  if (state === "connecting") return "connecting";
  return "connecting";
};

export const extractQrCode = (payload: Record<string, unknown> | null): string | null => {
  if (!payload) return null;

  const direct = payload.base64 ?? payload.qrcode;
  if (typeof direct === "string" && direct.length > 0) return direct;

  const nested = payload.qrcode;
  if (typeof nested === "object" && nested && "base64" in nested) {
    const value = (nested as { base64?: unknown }).base64;
    if (typeof value === "string" && value.length > 0) return value;
  }

  const instance = payload.instance;
  if (typeof instance === "object" && instance && "qrcode" in instance) {
    const qr = (instance as { qrcode?: unknown }).qrcode;
    if (typeof qr === "string" && qr.length > 0) return qr;
    if (typeof qr === "object" && qr && "base64" in qr) {
      const value = (qr as { base64?: unknown }).base64;
      if (typeof value === "string" && value.length > 0) return value;
    }
  }

  return null;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const tryFetchQrCode = async (instanceName: string): Promise<string | null> => {
  const attempts: Array<{ method: string; path: string }> = [
    { method: "GET", path: `/instance/connect/${instanceName}` },
    { method: "POST", path: `/instance/connect/${instanceName}` },
    { method: "GET", path: `/instance/qrcode/${instanceName}` },
    { method: "POST", path: `/instance/qrcode/${instanceName}` },
  ];

  for (let round = 0; round < 3; round++) {
    for (const attempt of attempts) {
      const result = await evolutionFetch(attempt.path, { method: attempt.method });
      const qr = extractQrCode(result.body);
      if (qr) return qr;
    }
    if (round < 2) await sleep(1200);
  }

  return null;
};

export const extractConnectionPhone = (payload: Record<string, unknown> | null): string | null => {
  if (!payload) return null;

  const instance = payload.instance;
  const owner =
    (typeof instance === "object" && instance && "owner" in instance
      ? (instance as { owner?: unknown }).owner
      : null) ?? payload.owner;

  if (typeof owner === "string") {
    const digits = owner.replace(/\D/g, "");
    return digits.length > 0 ? digits : null;
  }

  return null;
};

export const buildWebhookConfig = (
  webhookUrl: string | null,
  webhookToken: string | null,
  supabaseAnonKey: string | null,
) => {
  if (!webhookUrl) return null;

  const headers: Record<string, string> = {};
  if (webhookToken) headers["x-webhook-token"] = webhookToken;
  if (supabaseAnonKey) {
    headers.apikey = supabaseAnonKey;
    headers.Authorization = `Bearer ${supabaseAnonKey}`;
  }

  return {
    enabled: true,
    url: webhookUrl,
    byEvents: false,
    webhookByEvents: false,
    base64: true,
    webhookBase64: true,
    events: [
      "QRCODE_UPDATED",
      "CONNECTION_UPDATE",
      "MESSAGES_SET",
      "MESSAGES_UPSERT",
      "MESSAGES_UPDATE",
      "CHATS_UPSERT",
      "CHATS_UPDATE",
      "SEND_MESSAGE",
    ],
    headers: Object.keys(headers).length > 0 ? headers : undefined,
  };
};

export const setEvolutionWebhook = async (instanceName: string, webhookConfig: Record<string, unknown>) => {
  await evolutionFetch(`/webhook/set/${instanceName}`, {
    method: "POST",
    body: JSON.stringify({ webhook: webhookConfig }),
  });
};

/** Retorna a configuração atual do webhook na Evolution (null se ausente). */
export const fetchEvolutionWebhook = async (
  instanceName: string,
): Promise<Record<string, unknown> | null> => {
  const result = await evolutionFetch(`/webhook/find/${encodeURIComponent(instanceName)}`);
  if (!result.ok || !result.body || result.body === null) return null;
  return result.body;
};

export const isEvolutionWebhookConfigured = (
  webhook: Record<string, unknown> | null,
  expectedUrl: string,
): boolean => {
  if (!webhook) return false;
  const url = webhook.url;
  return typeof url === "string" && url.trim() === expectedUrl.trim();
};

export const syncConnectionWebhook = async (
  service: {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: number) => {
          maybeSingle: () => Promise<{ data: { webhook_token: string } | null }>;
        };
      };
      upsert: (
        values: Record<string, unknown>,
        options: { onConflict: string },
      ) => Promise<{ error: unknown }>;
    };
  },
  connection: { id: number; instance_name: string },
): Promise<string | null> => {
  const webhookUrl = Deno.env.get("EVOLUTION_WEBHOOK_URL") ?? null;
  if (!webhookUrl) return null;

  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("VITE_SUPABASE_ANON_KEY") ?? null;
  const globalToken = Deno.env.get("EVOLUTION_WEBHOOK_TOKEN") ?? null;

  const { data: secretRow } = await service
    .from("whatsapp_connection_webhook_secrets")
    .select("webhook_token")
    .eq("connection_id", connection.id)
    .maybeSingle();

  const webhookToken = secretRow?.webhook_token ?? globalToken ?? generateWebhookToken();
  const webhookConfig = buildWebhookConfig(webhookUrl, webhookToken, anonKey);
  if (!webhookConfig) return null;

  await setEvolutionWebhook(connection.instance_name, webhookConfig);

  await service.from("whatsapp_connection_webhook_secrets").upsert(
    {
      connection_id: connection.id,
      instance_name: connection.instance_name,
      webhook_token: webhookToken,
    },
    { onConflict: "connection_id" },
  );

  return webhookToken;
};

export const logoutEvolutionInstance = async (instanceName: string): Promise<void> => {
  const attempts: Array<{ method: string; path: string }> = [
    { method: "DELETE", path: `/instance/logout/${instanceName}` },
    { method: "POST", path: `/instance/logout/${instanceName}` },
  ];

  for (const attempt of attempts) {
    const result = await evolutionFetch(attempt.path, { method: attempt.method });
    if (result.ok || result.status === 404) return;
    const message = result.body?.message ?? result.raw ?? "";
    if (typeof message === "string" && message.toLowerCase().includes("not found")) return;
  }
};

export const deleteEvolutionInstance = async (instanceName: string): Promise<void> => {
  const attempts: Array<{ method: string; path: string }> = [
    { method: "DELETE", path: `/instance/delete/${instanceName}` },
    { method: "POST", path: `/instance/delete/${instanceName}` },
    { method: "DELETE", path: `/instance/${instanceName}` },
  ];

  for (const attempt of attempts) {
    const result = await evolutionFetch(attempt.path, { method: attempt.method });
    if (result.ok || result.status === 404) return;
    const message = result.body?.message ?? result.raw ?? "";
    if (typeof message === "string" && message.toLowerCase().includes("not found")) return;
  }
};

export const buildInstanceName = (tenantSlug: string) => {
  const safeSlug = tenantSlug.replace(/[^a-z0-9-]/gi, "").toLowerCase().slice(0, 24);
  const suffix = Math.floor(100000 + Math.random() * 900000);
  return `festaai-${safeSlug}-${Date.now()}-${suffix}`;
};

export const extractInstanceApiKey = (payload: Record<string, unknown> | null): string | null => {
  if (!payload) return null;

  const readToken = (value: unknown): string | null => {
    if (typeof value !== "object" || !value) return null;
    const record = value as Record<string, unknown>;
    const token = record.token ?? record.hash ?? record.apikey ?? record.apiKey;
    return typeof token === "string" && token.trim().length > 0 ? token.trim() : null;
  };

  const instanceToken = readToken(payload.instance);
  if (instanceToken) return instanceToken;

  const direct = payload.token ?? payload.hash ?? payload.apikey ?? payload.apiKey;
  if (typeof direct === "string" && direct.trim().length > 0) return direct.trim();

  return null;
};

const parseFetchInstancesEntries = (body: Record<string, unknown> | null): Record<string, unknown>[] => {
  if (!body) return [];

  if (Array.isArray(body)) {
    return body.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null);
  }

  const data = body.data;
  if (Array.isArray(data)) {
    return data.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null);
  }

  if (typeof data === "object" && data) {
    return [data as Record<string, unknown>];
  }

  return [body];
};

export const fetchInstanceApiKey = async (instanceName: string): Promise<string | null> => {
  const result = await evolutionFetch(
    `/instance/fetchInstances?instanceName=${encodeURIComponent(instanceName)}`,
  );

  if (!result.ok) return null;

  for (const entry of parseFetchInstancesEntries(result.body)) {
    const token =
      (typeof entry.token === "string" && entry.token.trim() ? entry.token.trim() : null) ??
      (typeof entry.hash === "string" && entry.hash.trim() ? entry.hash.trim() : null) ??
      (typeof entry.apikey === "string" && entry.apikey.trim() ? entry.apikey.trim() : null) ??
      extractInstanceApiKey(entry);

    if (token) return token;
  }

  return null;
};

export const resolveInstanceApiKey = async (
  instanceName: string,
  createPayload: Record<string, unknown> | null,
): Promise<string | null> => {
  const fromCreate = extractInstanceApiKey(createPayload);
  if (fromCreate) return fromCreate;
  return await fetchInstanceApiKey(instanceName);
};

export const extractMediaBase64FromResponse = (payload: Record<string, unknown> | null): string | null => {
  if (!payload) return null;

  const direct = payload.base64;
  if (typeof direct === "string" && direct.length > 0) return direct;

  const data = payload.data;
  if (typeof data === "object" && data) {
    const nested = (data as { base64?: unknown }).base64;
    if (typeof nested === "string" && nested.length > 0) return nested;
  }

  return null;
};

export const fetchMessageMediaBase64 = async (
  instanceName: string,
  messageId: string,
  remoteJid: string | null,
  convertToMp4 = false,
): Promise<{ base64: string | null; mimetype: string | null }> => {
  const key: Record<string, string> = { id: messageId };
  if (remoteJid) key.remoteJid = remoteJid;

  const result = await evolutionFetch(
    `/chat/getBase64FromMediaMessage/${instanceName}`,
    {
      method: "POST",
      body: JSON.stringify({
        message: { key },
        convertToMp4,
      }),
    },
    30000,
  );

  if (!result.ok) return { base64: null, mimetype: null };

  const base64 = extractMediaBase64FromResponse(result.body);
  const mimetype =
    typeof result.body?.mimetype === "string" && result.body.mimetype.trim()
      ? result.body.mimetype.trim()
      : null;

  return { base64, mimetype };
};
