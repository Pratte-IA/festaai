import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

import { resolveAuthedPlatformAdmin } from "../_shared/auth-tenant.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { forwardToN8n } from "../_shared/n8n-client.ts";

const bodySchema = z.object({
  search_name: z.string().trim().min(1).max(200),
  city: z.string().trim().min(1).max(120),
  state: z
    .string()
    .trim()
    .length(2)
    .transform((value) => value.toUpperCase()),
  segment: z.string().trim().min(1).max(80),
  search_terms: z.array(z.string().trim().min(1).max(200)).min(1).max(50),
  max_results_per_term: z.number().int().min(1).max(100),
  notes: z.string().trim().max(4000).nullable().optional(),
});

interface StartSearchRpcResult {
  batch_id: string;
  coverage_id: number;
  run_ids: number[];
  payload: {
    search_name: string;
    state: string;
    city: string;
    segment: string;
    search_terms: string[];
    max_results_per_term: number;
    notes: string | null;
    source: "festaai_admin";
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseStartResult = (data: unknown): StartSearchRpcResult | null => {
  if (!isRecord(data)) return null;
  const payload = data.payload;
  if (!isRecord(payload)) return null;

  const runIdsRaw = data.run_ids;
  const runIds = Array.isArray(runIdsRaw)
    ? runIdsRaw
        .map((value) => (typeof value === "number" ? value : Number(value)))
        .filter((value) => Number.isFinite(value))
    : [];

  const termsRaw = payload.search_terms;
  const searchTerms = Array.isArray(termsRaw)
    ? termsRaw.filter((term): term is string => typeof term === "string")
    : [];

  const coverageId =
    typeof data.coverage_id === "number"
      ? data.coverage_id
      : typeof data.coverage_id === "string"
        ? Number(data.coverage_id)
        : NaN;

  const maxResults =
    typeof payload.max_results_per_term === "number"
      ? payload.max_results_per_term
      : typeof payload.max_results_per_term === "string"
        ? Number(payload.max_results_per_term)
        : NaN;

  if (
    typeof data.batch_id !== "string" ||
    !Number.isFinite(coverageId) ||
    typeof payload.search_name !== "string" ||
    typeof payload.city !== "string" ||
    typeof payload.state !== "string" ||
    typeof payload.segment !== "string" ||
    !Number.isFinite(maxResults) ||
    searchTerms.length === 0
  ) {
    return null;
  }

  return {
    batch_id: data.batch_id,
    coverage_id: coverageId,
    run_ids: runIds,
    payload: {
      search_name: payload.search_name,
      state: payload.state,
      city: payload.city,
      segment: payload.segment,
      search_terms: searchTerms,
      max_results_per_term: maxResults,
      notes: typeof payload.notes === "string" ? payload.notes : null,
      source: "festaai_admin",
    },
  };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }

  try {
    const auth = await resolveAuthedPlatformAdmin(req);
    if (auth instanceof Response) return auth;

    const body = bodySchema.parse(await req.json());
    const uniqueTerms = Array.from(
      new Set(body.search_terms.map((term) => term.trim()).filter(Boolean)),
    );

    if (uniqueTerms.length === 0) {
      return jsonResponse({ ok: false, error: "Informe ao menos um termo de busca." }, 400);
    }

    const { data, error } = await auth.authedClient.rpc("radar_start_market_search", {
      p_search_name: body.search_name,
      p_city: body.city,
      p_state: body.state,
      p_segment: body.segment,
      p_search_terms: uniqueTerms,
      p_max_results_per_term: body.max_results_per_term,
      p_notes: body.notes ?? null,
    });

    if (error) {
      return jsonResponse({ ok: false, error: error.message }, 400);
    }

    const started = parseStartResult(data);
    if (!started) {
      return jsonResponse(
        { ok: false, error: "Resposta inválida ao iniciar a pesquisa no Radar." },
        500,
      );
    }

    const webhookUrl = (Deno.env.get("N8N_RADAR_00_WEBHOOK_URL") ?? "").trim();
    let webhookDispatched = false;
    let webhookStatus: number | null = null;
    let webhookError: string | null = null;

    if (webhookUrl) {
      const forward = await forwardToN8n(
        {
          ...started.payload,
          batch_id: started.batch_id,
          coverage_id: started.coverage_id,
          run_ids: started.run_ids,
        },
        webhookUrl,
      );
      webhookDispatched = forward.ok;
      webhookStatus = forward.responseStatus;
      webhookError = forward.errorMessage;
    }

    return jsonResponse({
      ok: true,
      batch_id: started.batch_id,
      coverage_id: started.coverage_id,
      run_ids: started.run_ids,
      payload: started.payload,
      webhook_configured: Boolean(webhookUrl),
      webhook_dispatched: webhookDispatched,
      webhook_status: webhookStatus,
      webhook_error: webhookError,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonResponse(
        { ok: false, error: error.issues[0]?.message ?? "Payload inválido." },
        400,
      );
    }

    const message = error instanceof Error ? error.message : "Falha ao iniciar pesquisa do Radar.";
    return jsonResponse({ ok: false, error: message }, 500);
  }
});
