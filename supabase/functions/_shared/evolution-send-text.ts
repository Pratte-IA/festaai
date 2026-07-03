import { evolutionFetch, evolutionHeaders, getEvolutionBaseUrl } from "./evolution-client.ts";

export interface SendEvolutionTextInput {
  instanceApiKey?: string | null;
  instanceName: string;
  number: string;
  text: string;
}

export interface SendEvolutionTextResult {
  errorMessage: string | null;
  messageId: string | null;
  ok: boolean;
  status: number;
}

const buildEvolutionAuthHeaders = (instanceApiKey?: string | null) => {
  const globalHeaders = evolutionHeaders();
  if (!instanceApiKey?.trim()) return globalHeaders;

  const key = instanceApiKey.trim();
  return {
    ...globalHeaders,
    Authorization: `Bearer ${key}`,
    apikey: key,
    "x-api-key": key,
  };
};

const extractMessageId = (body: Record<string, unknown> | null): string | null => {
  if (!body) return null;

  const key = body.key;
  if (typeof key === "object" && key) {
    const id = (key as { id?: unknown }).id;
    if (typeof id === "string" && id.trim()) return id.trim();
  }

  const messageId = body.messageId ?? body.id;
  return typeof messageId === "string" && messageId.trim() ? messageId.trim() : null;
};

export const sendEvolutionTextMessage = async (
  input: SendEvolutionTextInput,
): Promise<SendEvolutionTextResult> => {
  const path = `/message/sendText/${encodeURIComponent(input.instanceName)}`;
  const payload = {
    number: input.number,
    text: input.text,
  };

  const result = await evolutionFetch(path, {
    body: JSON.stringify(payload),
    headers: buildEvolutionAuthHeaders(input.instanceApiKey),
    method: "POST",
  });

  if (result.ok) {
    return {
      errorMessage: null,
      messageId: extractMessageId(result.body),
      ok: true,
      status: result.status,
    };
  }

  const errorMessage =
    (typeof result.body?.message === "string" && result.body.message) ||
    (typeof result.body?.error === "string" && result.body.error) ||
    result.raw ||
    `Evolution respondeu com status ${result.status}.`;

  return {
    errorMessage,
    messageId: null,
    ok: false,
    status: result.status,
  };
};

/** Útil para diagnóstico quando a Evolution não está configurada. */
export const getEvolutionApiBaseUrl = (): string => getEvolutionBaseUrl();
