import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

import { dispatchOportunidadeFuturaFollowup } from "../_shared/dispatch-oportunidade-futura-followup.ts";
import {
  addYearsToIsoDate,
  getBrazilTodayIsoDate,
  getFof1TriggerDate,
  getFof2TriggerDate,
  getFof3TriggerDate,
  getFofTargetPartyDate,
  isIsoDateOnOrBefore,
  isPastPartyForFof,
  shouldResetFofCycle,
  type OportunidadeFuturaFofStep,
} from "../_shared/oportunidade-futura-constants.ts";

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

type TenantInfo = { id: number; name: string; slug: string };

type EventoCandidate = {
  id: number;
  tenant_id: number;
  data_evento: string | null;
  fof1_enviado_em: string | null;
  fof2_enviado_em: string | null;
  fof3_enviado_em: string | null;
  fof_festa_alvo: string | null;
  fof_status: string | null;
};

type DispatchResult = {
  dispatched: boolean;
  eventoId: number;
  skippedReason: string | null;
};

type FofStep = "fof1" | "fof2" | "fof3";

const ensureFofTargetDate = async (
  supabase: ReturnType<typeof createClient>,
  evento: EventoCandidate,
  todayIso: string,
): Promise<string | null> => {
  if (typeof evento.fof_festa_alvo === "string") {
    return evento.fof_festa_alvo;
  }

  if (typeof evento.data_evento !== "string") return null;

  const target = getFofTargetPartyDate(evento.data_evento, todayIso);
  if (!target) return null;

  await supabase
    .from("eventos")
    .update({
      fof_festa_alvo: target,
      fof_status: "ativo",
    })
    .eq("id", evento.id)
    .is("fof_festa_alvo", null);

  return target;
};

const maybeResetFofCycle = async (
  supabase: ReturnType<typeof createClient>,
  evento: EventoCandidate,
  todayIso: string,
): Promise<EventoCandidate> => {
  if (
    typeof evento.fof_festa_alvo !== "string" ||
    !shouldResetFofCycle({
      fop3EnviadoEm: evento.fof3_enviado_em,
      reativacaoFestaAlvo: evento.fof_festa_alvo,
      todayIso,
    })
  ) {
    return evento;
  }

  const nextTarget = addYearsToIsoDate(evento.fof_festa_alvo, 1);
  if (!nextTarget) return evento;

  await supabase
    .from("eventos")
    .update({
      fof1_enviado_em: null,
      fof2_enviado_em: null,
      fof3_enviado_em: null,
      fof_festa_alvo: nextTarget,
      fof_status: "ativo",
    })
    .eq("id", evento.id);

  await supabase.from("evento_notas").insert({
    evento_id: evento.id,
    tenant_id: evento.tenant_id,
    texto:
      `[Automação] Novo ciclo FOF iniciado para festa alvo ${nextTarget}.\n` +
      "Sequência FOF1/FOF2/FOF3 reiniciada para o próximo ano.",
  });

  return {
    ...evento,
    fof1_enviado_em: null,
    fof2_enviado_em: null,
    fof3_enviado_em: null,
    fof_festa_alvo: nextTarget,
    fof_status: "ativo",
  };
};

const isEligibleForFof1 = (evento: EventoCandidate, target: string, todayIso: string): boolean => {
  if (evento.fof1_enviado_em) return false;

  const trigger = getFof1TriggerDate(target);
  return trigger !== null && isIsoDateOnOrBefore(trigger, todayIso);
};

const isEligibleForFof2 = (evento: EventoCandidate, todayIso: string): boolean => {
  if (!evento.fof1_enviado_em || evento.fof2_enviado_em) return false;
  if (evento.fof_status !== "ativo" && evento.fof_status !== null) return false;

  const trigger = getFof2TriggerDate(evento.fof1_enviado_em);
  return trigger !== null && isIsoDateOnOrBefore(trigger, todayIso);
};

const isEligibleForFof3 = (evento: EventoCandidate, target: string, todayIso: string): boolean => {
  if (!evento.fof2_enviado_em || evento.fof3_enviado_em) return false;
  if (evento.fof_status !== "ativo" && evento.fof_status !== null) return false;

  const trigger = getFof3TriggerDate(target);
  return trigger !== null && isIsoDateOnOrBefore(trigger, todayIso);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const cronSecret = optionalEnv("OPORTUNIDADE_FUTURA_FOLLOWUPS_CRON_SECRET");
    if (cronSecret) {
      const received = req.headers.get("x-cron-secret");
      if (received !== cronSecret) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }
    }

    const supabase = createClient(requiredEnv("SUPABASE_URL"), requiredEnv("SUPABASE_SERVICE_ROLE_KEY"));
    const now = new Date().toISOString();
    const todayIso = getBrazilTodayIsoDate();

    const { data: candidates, error: listError } = await supabase
      .from("eventos")
      .select(
        "id, tenant_id, data_evento, fof1_enviado_em, fof2_enviado_em, fof3_enviado_em, fof_festa_alvo, fof_status",
      )
      .eq("funil", "executadas")
      .eq("etapa", "oportunidade_futura")
      .neq("status_interno", "cancelado")
      .not("data_evento", "is", null)
      .or("fof_status.is.null,fof_status.eq.ativo");

    if (listError) throw listError;

    const tenantCache = new Map<number, TenantInfo | null>();
    const fof1Results: DispatchResult[] = [];
    const fof2Results: DispatchResult[] = [];
    const fof3Results: DispatchResult[] = [];
    const errors: Array<{ eventoId: number; message: string; step: FofStep }> = [];

    const loadTenant = async (tenantId: number) => {
      if (tenantCache.has(tenantId)) return tenantCache.get(tenantId);

      const { data, error } = await supabase
        .from("tenants")
        .select("id, name, slug")
        .eq("id", tenantId)
        .maybeSingle();

      if (error) throw error;
      const tenant = data ? { id: data.id, name: data.name, slug: data.slug } : null;
      tenantCache.set(tenantId, tenant);
      return tenant;
    };

    const dispatchStep = async (eventoId: number, tenantId: number, step: OportunidadeFuturaFofStep) => {
      const tenant = await loadTenant(tenantId);
      if (!tenant) {
        return {
          dispatched: false,
          skippedReason: "Tenant não encontrado para follow-up FOF.",
        };
      }

      return dispatchOportunidadeFuturaFollowup(supabase, {
        eventoId,
        step,
        tenant,
        triggeredAt: now,
      });
    };

    const pastPartyCandidates = (candidates ?? []).filter(
      (evento): evento is EventoCandidate =>
        typeof evento.data_evento === "string" &&
        isPastPartyForFof(evento.data_evento, todayIso),
    );

    const prepared: EventoCandidate[] = [];

    for (const evento of pastPartyCandidates) {
      const withTarget = { ...evento };
      const target = await ensureFofTargetDate(supabase, withTarget, todayIso);
      if (!target) continue;

      withTarget.fof_festa_alvo = target;
      const reset = await maybeResetFofCycle(supabase, withTarget, todayIso);
      prepared.push(reset);
    }

    const fof1Eligible = prepared.filter((evento) => {
      const target = evento.fof_festa_alvo;
      return typeof target === "string" && isEligibleForFof1(evento, target, todayIso);
    });

    for (const evento of fof1Eligible) {
      try {
        const result = await dispatchStep(evento.id, evento.tenant_id, 1);
        fof1Results.push({
          dispatched: result.dispatched,
          eventoId: evento.id,
          skippedReason: result.skippedReason,
        });

        if (result.errorMessage) {
          errors.push({ eventoId: evento.id, message: result.errorMessage, step: "fof1" });
        }
      } catch (dispatchError) {
        errors.push({
          eventoId: evento.id,
          message:
            dispatchError instanceof Error
              ? dispatchError.message
              : "Erro ao disparar FOF1.",
          step: "fof1",
        });
      }
    }

    const fof2Eligible = prepared.filter((evento) => isEligibleForFof2(evento, todayIso));

    for (const evento of fof2Eligible) {
      try {
        const result = await dispatchStep(evento.id, evento.tenant_id, 2);
        fof2Results.push({
          dispatched: result.dispatched,
          eventoId: evento.id,
          skippedReason: result.skippedReason,
        });

        if (result.errorMessage) {
          errors.push({ eventoId: evento.id, message: result.errorMessage, step: "fof2" });
        }
      } catch (dispatchError) {
        errors.push({
          eventoId: evento.id,
          message:
            dispatchError instanceof Error
              ? dispatchError.message
              : "Erro ao disparar FOF2.",
          step: "fof2",
        });
      }
    }

    const fof3Eligible = prepared.filter((evento) => {
      const target = evento.fof_festa_alvo;
      return typeof target === "string" && isEligibleForFof3(evento, target, todayIso);
    });

    for (const evento of fof3Eligible) {
      try {
        const result = await dispatchStep(evento.id, evento.tenant_id, 3);
        fof3Results.push({
          dispatched: result.dispatched,
          eventoId: evento.id,
          skippedReason: result.skippedReason,
        });

        if (result.errorMessage) {
          errors.push({ eventoId: evento.id, message: result.errorMessage, step: "fof3" });
        }
      } catch (dispatchError) {
        errors.push({
          eventoId: evento.id,
          message:
            dispatchError instanceof Error
              ? dispatchError.message
              : "Erro ao disparar FOF3.",
          step: "fof3",
        });
      }
    }

    return jsonResponse({
      errors,
      fof1: {
        candidates: pastPartyCandidates.length,
        dispatchResults: fof1Results,
        eligible: fof1Eligible.length,
      },
      fof2: {
        dispatchResults: fof2Results,
        eligible: fof2Eligible.length,
      },
      fof3: {
        dispatchResults: fof3Results,
        eligible: fof3Eligible.length,
      },
      processedAt: now,
      todayBrazil: todayIso,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado.";
    console.error("[process-oportunidade-futura-followups]", message);
    return jsonResponse({ error: message }, 500);
  }
});
