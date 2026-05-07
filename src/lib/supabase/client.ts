import { createClient } from "@supabase/supabase-js";

import { Database } from "./database.types";

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
});
