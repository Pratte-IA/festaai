import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

import { dispatchSatisfactionSurveyFollowup } from "../_shared/dispatch-satisfaction-survey-followup.ts";
import { SATISFACTION_SURVEY_FOLLOWUP_DELAY_HOURS } from "../_shared/satisfaction-survey-followup-constants.ts";

const corsHeaders = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });

const requiredEnv = (key: string) => {
  const value = Deno.env.get(key);
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

const optionalEnv = (key: string) => Deno.env.get(key) ?? "";

const hoursSince = (from: string, to = new Date()) =>
  (to.getTime() - new Date(from).getTime()) / (1000 * 60 * 60);

type TenantInfo = { id: number; name: string; slug: string };

type DispatchResult = {
  dispatched: boolean;
  eventoId: number;
  skippedReason: string | null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const cronSecret = optionalEnv("SATISFACTION_SURVEY_FOLLOWUPS_CRON_SECRET");
    if (cronSecret) {
      const received = req.headers.get("x-cron-secret");
      if (received !== cronSecret) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }
    }

    const supabase = createClient(
      requiredEnv("SUPABASE_URL"),
      requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    );
    const now = new Date();
    const nowIso = now.toISOString();

    const tenantCache = new Map<number, TenantInfo | null>();
    const results: DispatchResult[] = [];
    const errors: Array<{ eventoId: number; message: string }> = [];

    const { data: pending, error: queryError } = await supabase
      .from("eventos")
      .select("id, tenant_id, satisfaction_survey_whatsapp_enviado_em")
      .eq("funil", "executadas")
      .eq("etapa", "aguardando_feedback")
      .not("satisfaction_survey_whatsapp_enviado_em", "is", null)
      .is("satisfaction_survey_preenchido_em", null)
      .is("satisfaction_survey_followup_enviado_em", null);

    if (queryError) throw queryError;

    const eligible = (pending ?? []).filter((evento) => {
      if (typeof evento.satisfaction_survey_whatsapp_enviado_em !== "string") return false;
      return (
        hoursSince(evento.satisfaction_survey_whatsapp_enviado_em, now) >=
        SATISFACTION_SURVEY_FOLLOWUP_DELAY_HOURS
      );
    });

    const loadTenant = async (tenantId: number) => {
      if (tenantCache.has(tenantId)) return tenantCache.get(tenantId);

      const { data, error } = await supabase
        .from("tenants")
        .select("id, name, slug")
        .eq("id", tenantId)
        .maybeSingle();

      if (error) throw error;
      const tenant = data
        ? { id: data.id as number, name: data.name as string, slug: data.slug as string }
        : null;
      tenantCache.set(tenantId, tenant);
      return tenant;
    };

    for (const evento of eligible) {
      const tenantId = evento.tenant_id as number;
      const eventoId = evento.id as number;

      try {
        const tenant = await loadTenant(tenantId);
        if (!tenant) {
          results.push({
            dispatched: false,
            eventoId,
            skippedReason: "Tenant não encontrado para lembrete da pesquisa.",
          });
          continue;
        }

        const result = await dispatchSatisfactionSurveyFollowup(supabase, {
          eventoId,
          tenant,
          triggeredAt: nowIso,
        });

        results.push({
          dispatched: result.dispatched,
          eventoId,
          skippedReason: result.skippedReason,
        });

        if (!result.dispatched && result.errorMessage) {
          errors.push({ eventoId, message: result.errorMessage });
        }
      } catch (error) {
        errors.push({
          eventoId,
          message: error instanceof Error ? error.message : "Erro ao disparar lembrete da pesquisa.",
        });
      }
    }

    return jsonResponse({
      delayHours: SATISFACTION_SURVEY_FOLLOWUP_DELAY_HOURS,
      dispatched: results.filter((item) => item.dispatched).length,
      eligible: eligible.length,
      errors,
      processedAt: nowIso,
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado.";
    console.error("[process-satisfaction-survey-followups]", message);
    return jsonResponse({ error: message }, 500);
  }
});
