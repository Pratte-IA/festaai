import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

import { dispatchSeteDiasAntesReminder } from "../_shared/dispatch-sete-dias-antes.ts";
import {
  getBrazilTodayIsoDate,
  getTargetPartyDateForSeteDiasReminder,
  isSeteDiasAutomationActive,
  SETE_DIAS_AUTOMATION_EFFECTIVE_DATE,
  shouldSendSeteDiasReminder,
} from "../_shared/sete-dias-antes-automation.ts";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const cronSecret = optionalEnv("SETE_DIAS_ANTES_CRON_SECRET");
    if (cronSecret) {
      const received = req.headers.get("x-cron-secret");
      if (received !== cronSecret) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }
    }

    const todayBrazil = getBrazilTodayIsoDate();
    const targetPartyDate = getTargetPartyDateForSeteDiasReminder(todayBrazil);

    if (!isSeteDiasAutomationActive(todayBrazil)) {
      return jsonResponse({
        active: false,
        effectiveDate: SETE_DIAS_AUTOMATION_EFFECTIVE_DATE,
        message: "Automação de 7 dias Antes ainda não está ativa.",
        dispatchedCount: 0,
        targetPartyDate,
        todayBrazil,
      });
    }

    const supabase = createClient(requiredEnv("SUPABASE_URL"), requiredEnv("SUPABASE_SERVICE_ROLE_KEY"));

    const { data: candidates, error: listError } = await supabase
      .from("eventos")
      .select("id, tenant_id, data_evento, funil, status_interno, sete_dias_whatsapp_enviado_em")
      .eq("funil", "festa")
      .eq("status_interno", "ativo")
      .eq("data_evento", targetPartyDate)
      .is("sete_dias_whatsapp_enviado_em", null);

    if (listError) throw listError;

    const now = new Date().toISOString();
    const eligible = (candidates ?? []).filter((evento) =>
      typeof evento.data_evento === "string" &&
      shouldSendSeteDiasReminder(evento.data_evento, todayBrazil),
    );

    let dispatchedCount = 0;
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

    for (const evento of eligible) {
      try {
        const tenant = await loadTenant(evento.tenant_id);
        if (!tenant) {
          dispatchResults.push({
            dispatched: false,
            eventoId: evento.id,
            skippedReason: "Tenant não encontrado para disparo de 7 dias Antes.",
          });
          continue;
        }

        const dispatchResult = await dispatchSeteDiasAntesReminder(supabase, {
          eventoId: evento.id,
          tenant,
          triggeredAt: now,
        });

        dispatchResults.push({
          dispatched: dispatchResult.dispatched,
          eventoId: evento.id,
          skippedReason: dispatchResult.skippedReason,
        });

        if (dispatchResult.dispatched) {
          dispatchedCount += 1;
        }

        if (dispatchResult.errorMessage) {
          errors.push({
            eventoId: evento.id,
            message: dispatchResult.errorMessage,
          });
        }
      } catch (dispatchError) {
        errors.push({
          eventoId: evento.id,
          message:
            dispatchError instanceof Error
              ? dispatchError.message
              : "Erro ao disparar lembrete de 7 dias Antes.",
        });
      }
    }

    return jsonResponse({
      active: true,
      candidates: candidates?.length ?? 0,
      dispatchResults,
      dispatchedCount,
      effectiveDate: SETE_DIAS_AUTOMATION_EFFECTIVE_DATE,
      eligible: eligible.length,
      errors,
      targetPartyDate,
      todayBrazil,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado.";
    console.error("[process-sete-dias-antes]", message);
    return jsonResponse({ error: message }, 500);
  }
});
