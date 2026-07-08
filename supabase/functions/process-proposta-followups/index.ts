import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

import { dispatchPropostaFollowup0 } from "../_shared/dispatch-proposta-followup-0.ts";
import { dispatchPropostaFollowup1 } from "../_shared/dispatch-proposta-followup-1.ts";
import { dispatchPropostaFollowup2 } from "../_shared/dispatch-proposta-followup-2.ts";
import { dispatchPropostaFollowup3 } from "../_shared/dispatch-proposta-followup-3.ts";
import { dispatchPropostaFollowup4 } from "../_shared/dispatch-proposta-followup-4.ts";
import {
  isWithinPropostaFollowup0BusinessHours,
  PROPOSTA_FOLLOWUP_0_DELAY_HOURS,
  PROPOSTA_FOLLOWUP_1_DELAY_HOURS,
  PROPOSTA_FOLLOWUP_2_DELAY_HOURS,
  PROPOSTA_FOLLOWUP_3_DELAY_HOURS,
  PROPOSTA_FOLLOWUP_4_DELAY_HOURS,
} from "../_shared/proposta-followup-constants.ts";

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

const hoursSince = (from: string, to = new Date()) =>
  (to.getTime() - new Date(from).getTime()) / (1000 * 60 * 60);

type TenantInfo = { id: number; name: string; slug: string };

type DispatchResult = {
  dispatched: boolean;
  eventoId: number;
  skippedReason: string | null;
  variante: string | null;
};

type Fu3DispatchResult = {
  dispatched: boolean;
  eventoId: number;
  skippedReason: string | null;
};

type Fu4DispatchResult = {
  dispatched: boolean;
  eventoId: number;
  movedToPerdido: boolean;
  skippedReason: string | null;
};

type Fu0DispatchResult = {
  dispatched: boolean;
  eventoId: number;
  skippedReason: string | null;
};

type FollowupStep = "fu0" | "fu1" | "fu2" | "fu3" | "fu4";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const cronSecret = optionalEnv("PROPOSTA_FOLLOWUPS_CRON_SECRET");
    if (cronSecret) {
      const received = req.headers.get("x-cron-secret");
      if (received !== cronSecret) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }
    }

    const supabase = createClient(requiredEnv("SUPABASE_URL"), requiredEnv("SUPABASE_SERVICE_ROLE_KEY"));
    const now = new Date().toISOString();

    const inactiveStatuses = new Set(["perdido", "cancelado"]);

    const tenantCache = new Map<number, TenantInfo | null>();
    const fu0Results: Fu0DispatchResult[] = [];
    const fu1Results: DispatchResult[] = [];
    const fu2Results: DispatchResult[] = [];
    const fu3Results: Fu3DispatchResult[] = [];
    const fu4Results: Fu4DispatchResult[] = [];
    const errors: Array<{ eventoId: number; message: string; step: FollowupStep }> = [];

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

    // FU0 (retomada de contato inicial): leads que não retornaram após a nossa
    // última mensagem. Só é disparado dentro do horário comercial (08h–18h) e
    // 12h após a nossa última mensagem (marco em contato_inicial_ultima_mensagem_em).
    const fu0WithinBusinessHours = isWithinPropostaFollowup0BusinessHours(new Date(now));
    let fu0Candidates: Array<{
      id: number;
      tenant_id: number;
      contato_inicial_ultima_mensagem_em: string | null;
      status_interno?: string;
    }> = [];

    if (fu0WithinBusinessHours) {
      const { data, error: fu0ListError } = await supabase
        .from("eventos")
        .select("id, tenant_id, contato_inicial_ultima_mensagem_em, status_interno")
        .eq("funil", "vendas")
        .eq("etapa", "contato_inicial")
        .not("contato_inicial_ultima_mensagem_em", "is", null)
        .is("followup_0_enviado_em", null);

      if (fu0ListError) throw fu0ListError;
      fu0Candidates = data ?? [];
    }

    const fu0Active = fu0Candidates.filter((evento) => {
      const status = evento.status_interno;
      return !status || !inactiveStatuses.has(status);
    });

    const fu0Eligible = fu0Active.filter((evento) => {
      if (typeof evento.contato_inicial_ultima_mensagem_em !== "string") return false;
      return hoursSince(evento.contato_inicial_ultima_mensagem_em) >= PROPOSTA_FOLLOWUP_0_DELAY_HOURS;
    });

    for (const evento of fu0Eligible) {
      try {
        const tenant = await loadTenant(evento.tenant_id);
        if (!tenant) {
          fu0Results.push({
            dispatched: false,
            eventoId: evento.id,
            skippedReason: "Tenant não encontrado para follow-up.",
          });
          continue;
        }

        const result = await dispatchPropostaFollowup0(supabase, {
          eventoId: evento.id,
          tenant,
          triggeredAt: now,
        });

        fu0Results.push({
          dispatched: result.dispatched,
          eventoId: evento.id,
          skippedReason: result.skippedReason,
        });

        if (result.errorMessage) {
          errors.push({ eventoId: evento.id, message: result.errorMessage, step: "fu0" });
        }
      } catch (dispatchError) {
        errors.push({
          eventoId: evento.id,
          message:
            dispatchError instanceof Error
              ? dispatchError.message
              : "Erro ao disparar follow-up 0.",
          step: "fu0",
        });
      }
    }

    // FU1 deve ser enviado a TODOS os leads em Proposta Enviada, mesmo que o
    // cliente já tenha respondido (followup_status "pausado_resposta"). Apenas
    // FU2/FU3/FU4 respeitam a pausa por resposta do cliente.
    const { data: fu1Candidates, error: fu1ListError } = await supabase
      .from("eventos")
      .select("id, tenant_id, proposta_enviada_em, status_interno")
      .eq("funil", "vendas")
      .eq("etapa", "proposta_enviada")
      .in("followup_status", ["ativo", "pausado_resposta"])
      .not("proposta_enviada_em", "is", null)
      .is("followup_1_enviado_em", null)
      .not("data_evento", "is", null);

    if (fu1ListError) throw fu1ListError;

    const fu1Active = (fu1Candidates ?? []).filter((evento) => {
      const status = (evento as { status_interno?: string }).status_interno;
      return !status || !inactiveStatuses.has(status);
    });

    const fu1Eligible = fu1Active.filter((evento) => {
      if (typeof evento.proposta_enviada_em !== "string") return false;
      return hoursSince(evento.proposta_enviada_em) >= PROPOSTA_FOLLOWUP_1_DELAY_HOURS;
    });

    for (const evento of fu1Eligible) {
      try {
        const tenant = await loadTenant(evento.tenant_id);
        if (!tenant) {
          fu1Results.push({
            dispatched: false,
            eventoId: evento.id,
            skippedReason: "Tenant não encontrado para follow-up.",
            variante: null,
          });
          continue;
        }

        const result = await dispatchPropostaFollowup1(supabase, {
          eventoId: evento.id,
          tenant,
          triggeredAt: now,
        });

        fu1Results.push({
          dispatched: result.dispatched,
          eventoId: evento.id,
          skippedReason: result.skippedReason,
          variante: result.variante,
        });

        if (result.errorMessage) {
          errors.push({ eventoId: evento.id, message: result.errorMessage, step: "fu1" });
        }
      } catch (dispatchError) {
        errors.push({
          eventoId: evento.id,
          message:
            dispatchError instanceof Error
              ? dispatchError.message
              : "Erro ao disparar follow-up 1.",
          step: "fu1",
        });
      }
    }

    const { data: fu2Candidates, error: fu2ListError } = await supabase
      .from("eventos")
      .select("id, tenant_id, followup_1_enviado_em, status_interno")
      .eq("funil", "vendas")
      .eq("etapa", "proposta_enviada")
      .eq("followup_status", "ativo")
      .not("followup_1_enviado_em", "is", null)
      .is("followup_2_enviado_em", null)
      .not("data_evento", "is", null);

    if (fu2ListError) throw fu2ListError;

    const fu2Active = (fu2Candidates ?? []).filter((evento) => {
      const status = (evento as { status_interno?: string }).status_interno;
      return !status || !inactiveStatuses.has(status);
    });

    const fu2Eligible = fu2Active.filter((evento) => {
      if (typeof evento.followup_1_enviado_em !== "string") return false;
      return hoursSince(evento.followup_1_enviado_em) >= PROPOSTA_FOLLOWUP_2_DELAY_HOURS;
    });

    for (const evento of fu2Eligible) {
      try {
        const tenant = await loadTenant(evento.tenant_id);
        if (!tenant) {
          fu2Results.push({
            dispatched: false,
            eventoId: evento.id,
            skippedReason: "Tenant não encontrado para follow-up.",
            variante: null,
          });
          continue;
        }

        const result = await dispatchPropostaFollowup2(supabase, {
          eventoId: evento.id,
          tenant,
          triggeredAt: now,
        });

        fu2Results.push({
          dispatched: result.dispatched,
          eventoId: evento.id,
          skippedReason: result.skippedReason,
          variante: result.variante,
        });

        if (result.errorMessage) {
          errors.push({ eventoId: evento.id, message: result.errorMessage, step: "fu2" });
        }
      } catch (dispatchError) {
        errors.push({
          eventoId: evento.id,
          message:
            dispatchError instanceof Error
              ? dispatchError.message
              : "Erro ao disparar follow-up 2.",
          step: "fu2",
        });
      }
    }

    const { data: fu3Candidates, error: fu3ListError } = await supabase
      .from("eventos")
      .select("id, tenant_id, followup_2_enviado_em, status_interno")
      .eq("funil", "vendas")
      .eq("etapa", "proposta_enviada")
      .eq("followup_status", "ativo")
      .not("followup_2_enviado_em", "is", null)
      .is("followup_3_enviado_em", null)
      .not("data_evento", "is", null);

    if (fu3ListError) throw fu3ListError;

    const fu3Active = (fu3Candidates ?? []).filter((evento) => {
      const status = (evento as { status_interno?: string }).status_interno;
      return !status || !inactiveStatuses.has(status);
    });

    const fu3Eligible = fu3Active.filter((evento) => {
      if (typeof evento.followup_2_enviado_em !== "string") return false;
      return hoursSince(evento.followup_2_enviado_em) >= PROPOSTA_FOLLOWUP_3_DELAY_HOURS;
    });

    for (const evento of fu3Eligible) {
      try {
        const tenant = await loadTenant(evento.tenant_id);
        if (!tenant) {
          fu3Results.push({
            dispatched: false,
            eventoId: evento.id,
            skippedReason: "Tenant não encontrado para follow-up.",
          });
          continue;
        }

        const result = await dispatchPropostaFollowup3(supabase, {
          eventoId: evento.id,
          tenant,
          triggeredAt: now,
        });

        fu3Results.push({
          dispatched: result.dispatched,
          eventoId: evento.id,
          skippedReason: result.skippedReason,
        });

        if (result.errorMessage) {
          errors.push({ eventoId: evento.id, message: result.errorMessage, step: "fu3" });
        }
      } catch (dispatchError) {
        errors.push({
          eventoId: evento.id,
          message:
            dispatchError instanceof Error
              ? dispatchError.message
              : "Erro ao disparar follow-up 3.",
          step: "fu3",
        });
      }
    }

    const { data: fu4Candidates, error: fu4ListError } = await supabase
      .from("eventos")
      .select("id, tenant_id, followup_3_enviado_em, status_interno")
      .eq("funil", "vendas")
      .eq("etapa", "proposta_enviada")
      .eq("followup_status", "ativo")
      .not("followup_3_enviado_em", "is", null)
      .is("followup_4_enviado_em", null)
      .not("data_evento", "is", null);

    if (fu4ListError) throw fu4ListError;

    const fu4Active = (fu4Candidates ?? []).filter((evento) => {
      const status = (evento as { status_interno?: string }).status_interno;
      return !status || !inactiveStatuses.has(status);
    });

    const fu4Eligible = fu4Active.filter((evento) => {
      if (typeof evento.followup_3_enviado_em !== "string") return false;
      return hoursSince(evento.followup_3_enviado_em) >= PROPOSTA_FOLLOWUP_4_DELAY_HOURS;
    });

    for (const evento of fu4Eligible) {
      try {
        const tenant = await loadTenant(evento.tenant_id);
        if (!tenant) {
          fu4Results.push({
            dispatched: false,
            eventoId: evento.id,
            movedToPerdido: false,
            skippedReason: "Tenant não encontrado para follow-up.",
          });
          continue;
        }

        const result = await dispatchPropostaFollowup4(supabase, {
          eventoId: evento.id,
          tenant,
          triggeredAt: now,
        });

        fu4Results.push({
          dispatched: result.dispatched,
          eventoId: evento.id,
          movedToPerdido: result.movedToPerdido,
          skippedReason: result.skippedReason,
        });

        if (result.errorMessage) {
          errors.push({ eventoId: evento.id, message: result.errorMessage, step: "fu4" });
        }
      } catch (dispatchError) {
        errors.push({
          eventoId: evento.id,
          message:
            dispatchError instanceof Error
              ? dispatchError.message
              : "Erro ao disparar follow-up 4.",
          step: "fu4",
        });
      }
    }

    return jsonResponse({
      errors,
      fu0: {
        candidates: fu0Candidates.length,
        delayHours: PROPOSTA_FOLLOWUP_0_DELAY_HOURS,
        dispatchResults: fu0Results,
        eligible: fu0Eligible.length,
        withinBusinessHours: fu0WithinBusinessHours,
      },
      fu1: {
        candidates: fu1Candidates?.length ?? 0,
        delayHours: PROPOSTA_FOLLOWUP_1_DELAY_HOURS,
        dispatchResults: fu1Results,
        eligible: fu1Eligible.length,
      },
      fu2: {
        candidates: fu2Candidates?.length ?? 0,
        delayHours: PROPOSTA_FOLLOWUP_2_DELAY_HOURS,
        dispatchResults: fu2Results,
        eligible: fu2Eligible.length,
      },
      fu3: {
        candidates: fu3Candidates?.length ?? 0,
        delayHours: PROPOSTA_FOLLOWUP_3_DELAY_HOURS,
        dispatchResults: fu3Results,
        eligible: fu3Eligible.length,
      },
      fu4: {
        candidates: fu4Candidates?.length ?? 0,
        delayHours: PROPOSTA_FOLLOWUP_4_DELAY_HOURS,
        dispatchResults: fu4Results,
        eligible: fu4Eligible.length,
      },
      processedAt: now,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado.";
    console.error("[process-proposta-followups]", message);
    return jsonResponse({ error: message }, 500);
  }
});
