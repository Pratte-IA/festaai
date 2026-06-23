import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  discoverWorkingPoolerConfig,
  parseSupabaseDbUrl,
  resolveFestAiPostgresConfig,
  syncFestAiPostgresCredential,
} from "../_shared/n8n-postgres-credential-sync.ts";

const bodySchema = z.object({
  discover: z.boolean().optional(),
  inspect: z.boolean().optional(),
});

const isAuthorizedRequest = (req: Request) => {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (serviceKey) {
    const authorization = req.headers.get("Authorization");
    if (authorization === `Bearer ${serviceKey}`) return true;
  }

  const anonKey =
    Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("VITE_SUPABASE_ANON_KEY") ?? null;
  if (!anonKey) return false;

  const apiKey = req.headers.get("apikey");
  const authorization = req.headers.get("Authorization");
  return apiKey === anonKey || authorization === `Bearer ${anonKey}`;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }

  try {
    if (!isAuthorizedRequest(req)) {
      return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
    }

    const payload = bodySchema.parse(await req.json().catch(() => ({})));

    if (payload.discover) {
      const dbUrl = Deno.env.get("SUPABASE_DB_URL")?.trim();
      if (!dbUrl) {
        return jsonResponse({ ok: false, error: "SUPABASE_DB_URL não configurada." }, 500);
      }

      const discovered = await discoverWorkingPoolerConfig(parseSupabaseDbUrl(dbUrl));
      return jsonResponse({ ok: true, discovered });
    }

    if (payload.inspect) {
      const config = await resolveFestAiPostgresConfig();
      return jsonResponse({
        ok: true,
        config: {
          connectionMode: (Deno.env.get("N8N_POSTGRES_USE_DIRECT") ?? "false").trim().toLowerCase() === "true"
            ? "direct"
            : "pooler",
          database: config.database,
          hasDbUrl: Boolean(Deno.env.get("SUPABASE_DB_URL")),
          hasPoolerUrl: Boolean(Deno.env.get("SUPABASE_DB_POOLER_URL")),
          host: config.host,
          port: config.port,
          user: config.user,
        },
      });
    }

    const credential = await syncFestAiPostgresCredential();

    return jsonResponse({
      ok: true,
      credential,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonResponse({ ok: false, error: "Dados inválidos." }, 400);
    }

    const message = error instanceof Error ? error.message : "Erro inesperado.";
    return jsonResponse({ ok: false, error: message }, 500);
  }
});
