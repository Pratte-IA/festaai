import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

import { dispatchPerdidoFuturoFup1 } from "../_shared/dispatch-perdido-futuro-fup1.ts";
import { dispatchPerdidoReativacaoFollowup } from "../_shared/dispatch-perdido-reativacao-followup.ts";
import { isEligibleForFup1Dispatch } from "../_shared/perdido-futuro-constants.ts";
import {
  addYearsToIsoDate,
  getBrazilTodayIsoDate,
  getFop1TriggerDate,
  getFop2TriggerDate,
  getFop3TriggerDate,
  getReativacaoTargetPartyDate,
  isIsoDateOnOrBefore,
  isPastPartyForReativacao,
  shouldResetReativacaoCycle,
  type PerdidoReativacaoFopStep,
} from "../_shared/perdido-reativacao-constants.ts";

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
  fop1_enviado_em: string | null;
  fop2_enviado_em: string | null;
  fop3_enviado_em: string | null;
  reativacao_festa_alvo: string | null;
  reativacao_status: string | null;
};

type DispatchResult = {
  dispatched: boolean;
  eventoId: number;
  skippedReason: string | null;
};

type FopStep = "fop1" | "fop2" | "fop3" | "fup1";

const ensureReativacaoTargetDate = async (
  supabase: ReturnType<typeof createClient>,
  evento: EventoCandidate,
  todayIso: string,
): Promise<string | null> => {
  if (typeof evento.reativacao_festa_alvo === "string") {
    return evento.reativacao_festa_alvo;
  }

  if (typeof evento.data_evento !== "string") return null;

  const target = getReativacaoTargetPartyDate(evento.data_evento, todayIso);
  if (!target) return null;

  await supabase
    .from("eventos")
    .update({
      reativacao_festa_alvo: target,
      reativacao_status: "ativo",
    })
    .eq("id", evento.id)
    .is("reativacao_festa_alvo", null);

  return target;
};

const maybeResetReativacaoCycle = async (
  supabase: ReturnType<typeof createClient>,
  evento: EventoCandidate,
  todayIso: string,
): Promise<EventoCandidate> => {
  if (
    typeof evento.reativacao_festa_alvo !== "string" ||
    !shouldResetReativacaoCycle({
      fop3EnviadoEm: evento.fop3_enviado_em,
      reativacaoFestaAlvo: evento.reativacao_festa_alvo,
      todayIso,
    })
  ) {
    return evento;
  }

  const nextTarget = addYearsToIsoDate(evento.reativacao_festa_alvo, 1);
  if (!nextTarget) return evento;

  await supabase
    .from("eventos")
    .update({
      fop1_enviado_em: null,
      fop2_enviado_em: null,
      fop3_enviado_em: null,
      reativacao_festa_alvo: nextTarget,
      reativacao_status: "ativo",
    })
    .eq("id", evento.id);

  await supabase.from("evento_notas").insert({
    evento_id: evento.id,
    tenant_id: evento.tenant_id,
    texto:
      `[Automação] Novo ciclo de reativação iniciado para festa alvo ${nextTarget}.\n` +
      "Sequência FOP1/FOP2/FOP3 reiniciada para o próximo ano.",
  });

  return {
    ...evento,
    fop1_enviado_em: null,
    fop2_enviado_em: null,
    fop3_enviado_em: null,
    reativacao_festa_alvo: nextTarget,
    reativacao_status: "ativo",
  };
};

const isEligibleForFop1 = (evento: EventoCandidate, target: string, todayIso: string): boolean => {
  if (evento.fop1_enviado_em) return false;

  const trigger = getFop1TriggerDate(target);
  return trigger !== null && isIsoDateOnOrBefore(trigger, todayIso);
};

const isEligibleForFop2 = (evento: EventoCandidate, todayIso: string): boolean => {
  if (!evento.fop1_enviado_em || evento.fop2_enviado_em) return false;
  if (evento.reativacao_status !== "ativo" && evento.reativacao_status !== null) return false;

  const trigger = getFop2TriggerDate(evento.fop1_enviado_em);
  return trigger !== null && isIsoDateOnOrBefore(trigger, todayIso);
};

const isEligibleForFop3 = (evento: EventoCandidate, target: string, todayIso: string): boolean => {
  if (!evento.fop2_enviado_em || evento.fop3_enviado_em) return false;
  if (evento.reativacao_status !== "ativo" && evento.reativacao_status !== null) return false;

  const trigger = getFop3TriggerDate(target);
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
    const cronSecret = optionalEnv("PERDIDO_REATIVACAO_FOLLOWUPS_CRON_SECRET");
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
        "id, tenant_id, data_evento, fop1_enviado_em, fop2_enviado_em, fop3_enviado_em, reativacao_festa_alvo, reativacao_status",
      )
      .eq("funil", "vendas")
      .eq("etapa", "perdido")
      .eq("status_interno", "perdido")
      .not("data_evento", "is", null)
      .or("reativacao_status.is.null,reativacao_status.eq.ativo");

    if (listError) throw listError;

    const tenantCache = new Map<number, TenantInfo | null>();
    const fop1Results: DispatchResult[] = [];
    const fop2Results: DispatchResult[] = [];
    const fop3Results: DispatchResult[] = [];
    const fup1Results: Array<DispatchResult & { variante: string | null }> = [];
    const errors: Array<{ eventoId: number; message: string; step: FopStep }> = [];

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

    const dispatchStep = async (eventoId: number, tenantId: number, step: PerdidoReativacaoFopStep) => {
      const tenant = await loadTenant(tenantId);
      if (!tenant) {
        return {
          dispatched: false,
          skippedReason: "Tenant não encontrado para follow-up de reativação.",
        };
      }

      return dispatchPerdidoReativacaoFollowup(supabase, {
        eventoId,
        step,
        tenant,
        triggeredAt: now,
      });
    };

    const pastPartyCandidates = (candidates ?? []).filter(
      (evento): evento is EventoCandidate =>
        typeof evento.data_evento === "string" &&
        isPastPartyForReativacao(evento.data_evento, todayIso),
    );

    const prepared: EventoCandidate[] = [];

    for (const evento of pastPartyCandidates) {
      const withTarget = { ...evento };
      const target = await ensureReativacaoTargetDate(supabase, withTarget, todayIso);
      if (!target) continue;

      withTarget.reativacao_festa_alvo = target;
      const reset = await maybeResetReativacaoCycle(supabase, withTarget, todayIso);
      prepared.push(reset);
    }

    const fop1Eligible = prepared.filter((evento) => {
      const target = evento.reativacao_festa_alvo;
      return typeof target === "string" && isEligibleForFop1(evento, target, todayIso);
    });

    for (const evento of fop1Eligible) {
      try {
        const result = await dispatchStep(evento.id, evento.tenant_id, 1);
        fop1Results.push({
          dispatched: result.dispatched,
          eventoId: evento.id,
          skippedReason: result.skippedReason,
        });

        if (result.errorMessage) {
          errors.push({ eventoId: evento.id, message: result.errorMessage, step: "fop1" });
        }
      } catch (dispatchError) {
        errors.push({
          eventoId: evento.id,
          message:
            dispatchError instanceof Error
              ? dispatchError.message
              : "Erro ao disparar FOP1.",
          step: "fop1",
        });
      }
    }

    const fop2Eligible = prepared.filter((evento) => isEligibleForFop2(evento, todayIso));

    for (const evento of fop2Eligible) {
      try {
        const result = await dispatchStep(evento.id, evento.tenant_id, 2);
        fop2Results.push({
          dispatched: result.dispatched,
          eventoId: evento.id,
          skippedReason: result.skippedReason,
        });

        if (result.errorMessage) {
          errors.push({ eventoId: evento.id, message: result.errorMessage, step: "fop2" });
        }
      } catch (dispatchError) {
        errors.push({
          eventoId: evento.id,
          message:
            dispatchError instanceof Error
              ? dispatchError.message
              : "Erro ao disparar FOP2.",
          step: "fop2",
        });
      }
    }

    const fop3Eligible = prepared.filter((evento) => {
      const target = evento.reativacao_festa_alvo;
      return typeof target === "string" && isEligibleForFop3(evento, target, todayIso);
    });

    for (const evento of fop3Eligible) {
      try {
        const result = await dispatchStep(evento.id, evento.tenant_id, 3);
        fop3Results.push({
          dispatched: result.dispatched,
          eventoId: evento.id,
          skippedReason: result.skippedReason,
        });

        if (result.errorMessage) {
          errors.push({ eventoId: evento.id, message: result.errorMessage, step: "fop3" });
        }
      } catch (dispatchError) {
        errors.push({
          eventoId: evento.id,
          message:
            dispatchError instanceof Error
              ? dispatchError.message
              : "Erro ao disparar FOP3.",
          step: "fop3",
        });
      }
    }

    const { data: fupCandidates, error: fupListError } = await supabase
      .from("eventos")
      .select("id, tenant_id, data_evento, fup1_enviado_em")
      .eq("funil", "vendas")
      .eq("etapa", "perdido")
      .eq("status_interno", "perdido")
      .not("data_evento", "is", null)
      .is("fup1_enviado_em", null);

    if (fupListError) throw fupListError;

    const fup1Eligible = (fupCandidates ?? []).filter((evento) => {
      if (typeof evento.data_evento !== "string") return false;

      return isEligibleForFup1Dispatch({
        dataEvento: evento.data_evento,
        fup1EnviadoEm: evento.fup1_enviado_em,
        todayIso,
      });
    });

    for (const evento of fup1Eligible) {
      try {
        const tenant = await loadTenant(evento.tenant_id);
        if (!tenant) {
          fup1Results.push({
            dispatched: false,
            eventoId: evento.id,
            skippedReason: "Tenant não encontrado para follow-up FUP1.",
            variante: null,
          });
          continue;
        }

        const result = await dispatchPerdidoFuturoFup1(supabase, {
          eventoId: evento.id,
          tenant,
          triggeredAt: now,
        });

        fup1Results.push({
          dispatched: result.dispatched,
          eventoId: evento.id,
          skippedReason: result.skippedReason,
          variante: result.variante,
        });

        if (result.errorMessage) {
          errors.push({ eventoId: evento.id, message: result.errorMessage, step: "fup1" });
        }
      } catch (dispatchError) {
        errors.push({
          eventoId: evento.id,
          message:
            dispatchError instanceof Error
              ? dispatchError.message
              : "Erro ao disparar FUP1.",
          step: "fup1",
        });
      }
    }

    return jsonResponse({
      errors,
      fop1: {
        candidates: pastPartyCandidates.length,
        dispatchResults: fop1Results,
        eligible: fop1Eligible.length,
      },
      fop2: {
        dispatchResults: fop2Results,
        eligible: fop2Eligible.length,
      },
      fop3: {
        dispatchResults: fop3Results,
        eligible: fop3Eligible.length,
      },
      fup1: {
        candidates: fupCandidates?.length ?? 0,
        dispatchResults: fup1Results,
        eligible: fup1Eligible.length,
      },
      processedAt: now,
      todayBrazil: todayIso,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado.";
    console.error("[process-perdido-reativacao-followups]", message);
    return jsonResponse({ error: message }, 500);
  }
});
