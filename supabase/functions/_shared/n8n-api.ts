const requiredEnv = (key: string) => {
  const value = Deno.env.get(key);
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

export const n8nApiFetch = async <T = unknown>(path: string, init?: RequestInit): Promise<T> => {
  const baseUrl = requiredEnv("N8N_API_URL").replace(/\/$/, "");
  const apiKey = requiredEnv("N8N_API_KEY");

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-N8N-API-KEY": apiKey,
      ...(init?.headers ?? {}),
    },
  });

  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text };
    }
  }

  if (!response.ok) {
    const message =
      typeof body === "object" && body && "message" in body
        ? String((body as { message: unknown }).message)
        : text || `N8N API error (${response.status})`;
    throw new Error(message);
  }

  return body as T;
};
