import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

import { dispatchPesquisaSatisfacaoAfterPostParty } from "../_shared/dispatch-pesquisa-satisfacao.ts";
import {
  getBrazilTodayIsoDate,
  isPostPartyAutomationActive,
  POST_PARTY_AUTOMATION_EFFECTIVE_DATE,
  shouldTransitionToAguardandoFeedback,
} from "../_shared/post-party-automation.ts";

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
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

/** Janela para reenviar a pesquisa quando a transição ocorreu e o WhatsApp não saiu. */
const SURVEY_DISPATCH_RETRY_MS = 14 * 24 * 60 * 60 * 1000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const cronSecret = optionalEnv("POST_PARTY_TRANSITIONS_CRON_SECRET");
    if (cronSecret) {
      const received = req.headers.get("x-cron-secret");
      if (received !== cronSecret) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }
    }

    const todayBrazil = getBrazilTodayIsoDate();

    if (!isPostPartyAutomationActive(todayBrazil)) {
      return jsonResponse({
        active: false,
        effectiveDate: POST_PARTY_AUTOMATION_EFFECTIVE_DATE,
        message: "Automação pós-festa ainda não está ativa.",
        movedCount: 0,
        todayBrazil,
      });
    }

    const supabase = createClient(requiredEnv("SUPABASE_URL"), requiredEnv("SUPABASE_SERVICE_ROLE_KEY"));

    const { data: candidates, error: listError } = await supabase
      .from("eventos")
      .select("id, tenant_id, data_evento, etapa")
      .eq("funil", "festa")
      .eq("status_interno", "ativo")
      .is("executadas_transicao_em", null)
      .not("data_evento", "is", null);

    if (listError) throw listError;

    const now = new Date().toISOString();
    const eligible = (candidates ?? []).filter((evento) =>
      typeof evento.data_evento === "string" &&
      shouldTransitionToAguardandoFeedback(evento.data_evento, todayBrazil),
    );

    let movedCount = 0;
    const movedEventIds: number[] = [];
    const dispatchResults: Array<{
      dispatched: boolean;
      eventoId: number;
      skippedReason: string | null;
    }> = [];
    const errors: Array<{ eventoId: number; message: string }> = [];

    const tenantCache = new Map<
      number,
      { id: number; name: string; slug: string } | null
    >();

    const loadTenant = async (tenantId: number) => {
      if (tenantCache.has(tenantId)) return tenantCache.get(tenantId);

      const { data, error } = await supabase
        .from("tenants")
        .select("id, name, slug")
        .eq("id", tenantId)
        .maybeSingle();

      if (error) throw error;
      const tenant = data
        ? { id: data.id, name: data.name, slug: data.slug }
        : null;
      tenantCache.set(tenantId, tenant);
      return tenant;
    };

    const dispatchSurvey = async (eventoId: number, tenantId: number) => {
      try {
        const tenant = await loadTenant(tenantId);
        if (!tenant) {
          dispatchResults.push({
            dispatched: false,
            eventoId,
            skippedReason: "Tenant não encontrado para disparo da pesquisa.",
          });
          return;
        }

        const dispatchResult = await dispatchPesquisaSatisfacaoAfterPostParty(supabase, {
          eventoId,
          tenant,
          triggeredAt: now,
        });

        dispatchResults.push({
          dispatched: dispatchResult.dispatched,
          eventoId,
          skippedReason: dispatchResult.skippedReason,
        });

        if (dispatchResult.errorMessage) {
          errors.push({
            eventoId,
            message: dispatchResult.errorMessage,
          });
        }
      } catch (dispatchError) {
        errors.push({
          eventoId,
          message:
            dispatchError instanceof Error
              ? dispatchError.message
              : "Erro ao disparar pesquisa de satisfação.",
        });
      }
    };

    for (const evento of eligible) {
      const { error: updateError } = await supabase
        .from("eventos")
        .update({
          etapa: "aguardando_feedback",
          executadas_transicao_em: now,
          funil: "executadas",
        })
        .eq("id", evento.id)
        .eq("tenant_id", evento.tenant_id)
        .eq("funil", "festa")
        .is("executadas_transicao_em", null);

      if (updateError) {
        errors.push({
          eventoId: evento.id,
          message: updateError.message,
        });
        continue;
      }

      movedCount += 1;
      movedEventIds.push(evento.id);
      await dispatchSurvey(evento.id, evento.tenant_id);
    }

    const retrySince = new Date(Date.parse(now) - SURVEY_DISPATCH_RETRY_MS).toISOString();
    const { data: pendingSurveys, error: pendingError } = await supabase
      .from("eventos")
      .select("id, tenant_id")
      .eq("funil", "executadas")
      .eq("etapa", "aguardando_feedback")
      .eq("status_interno", "ativo")
      .is("satisfaction_survey_whatsapp_enviado_em", null)
      .gte("executadas_transicao_em", retrySince);

    if (pendingError) throw pendingError;

    const attemptedIds = new Set(movedEventIds);
    let retriedCount = 0;

    for (const evento of pendingSurveys ?? []) {
      if (attemptedIds.has(evento.id)) continue;
      retriedCount += 1;
      await dispatchSurvey(evento.id, evento.tenant_id);
    }

    return jsonResponse({
      active: true,
      candidates: candidates?.length ?? 0,
      dispatchResults,
      effectiveDate: POST_PARTY_AUTOMATION_EFFECTIVE_DATE,
      eligible: eligible.length,
      retriedCount,
      errors,
      movedCount,
      movedEventIds,
      todayBrazil,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado.";
    console.error("[process-post-party-transitions]", message);
    return jsonResponse({ error: message }, 500);
  }
});
