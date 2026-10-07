const PUBLIC_FUNCTION_TIMEOUT_MS = 20_000;

const readPublicEnv = (key: "VITE_SUPABASE_ANON_KEY" | "VITE_SUPABASE_URL") => {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error("Configuração pública do FestaAI indisponível.");
  }
  return value;
};

const readErrorMessage = (payload: unknown, fallback: string) => {
  if (payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string") {
    return payload.error;
  }
  return fallback;
};

/**
 * Chamada direta da Edge Function pública.
 * Não usa o cliente Supabase autenticado: com sessão aberta no app, o invoke
 * espera o lock de auth e a tela fica presa em "Carregando formulário".
 */
export const invokePublicFunction = async <T>(functionName: string, body: unknown): Promise<T> => {
  const supabaseUrl = readPublicEnv("VITE_SUPABASE_URL").replace(/\/$/, "");
  const anonKey = readPublicEnv("VITE_SUPABASE_ANON_KEY");
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), PUBLIC_FUNCTION_TIMEOUT_MS);

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
      body: JSON.stringify(body),
      headers: {
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: controller.signal,
    });

    const payload = (await response.json().catch(() => null)) as T | { error?: string } | null;

    if (!response.ok || !payload) {
      throw new Error(readErrorMessage(payload, "Não foi possível concluir a solicitação."));
    }

    if (typeof payload === "object" && payload && "error" in payload && typeof payload.error === "string") {
      throw new Error(payload.error);
    }

    return payload;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("A solicitação demorou demais. Atualize a página e tente de novo.");
    }
    if (error instanceof Error) throw error;
    throw new Error("Não foi possível concluir a solicitação.");
  } finally {
    window.clearTimeout(timeoutId);
  }
};
