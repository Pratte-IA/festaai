import { createClient } from "@supabase/supabase-js";

import { Database } from "./database.types";
import { applyUnitRequestHeaders, resolveRequestUrl } from "./unit-request";

type PublicEnvKey = "VITE_SUPABASE_URL" | "VITE_SUPABASE_ANON_KEY";

const getRequiredPublicEnv = (key: PublicEnvKey): string => {
  const value = import.meta.env[key];

  if (!value) {
    throw new Error(`Missing required public environment variable: ${key}`);
  }

  return value;
};

const supabaseUrl = getRequiredPublicEnv("VITE_SUPABASE_URL");
const supabaseAnonKey = getRequiredPublicEnv("VITE_SUPABASE_ANON_KEY");

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: true,
    persistSession: true,
  },
  global: {
    fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      const url = resolveRequestUrl(input);
      // Cabeçalhos de unidade são só para o PostgREST (RLS). Em Edge Functions
      // eles disparam preflight e o browser bloqueia a chamada se o CORS
      // da função não os listar — o formulário público quebrava com isso.
      if (!url.includes("/functions/v1/")) {
        applyUnitRequestHeaders(headers);
      }
      return fetch(input, { ...init, headers });
    },
  },
});
