import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

import {
  CONTRACT_SIGNATURE_FOLLOWUP_INICIAL_DELAY_HOURS,
  CONTRACT_SIGNATURE_FOLLOWUP_LEMBRETE_DELAY_HOURS,
  isWithinContractSignatureFollowupBusinessHours,
} from "../_shared/contract-signature-followup-constants.ts";
import { dispatchContractSignatureFollowup } from "../_shared/dispatch-contract-signature-followup.ts";

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

type FollowupStep = "inicial" | "lembrete";

type DispatchResult = {
  contractId: number;
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
    const cronSecret = optionalEnv("CONTRACT_SIGNATURE_FOLLOWUPS_CRON_SECRET");
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
    const withinBusinessHours = isWithinContractSignatureFollowupBusinessHours(now);

    const tenantCache = new Map<number, TenantInfo | null>();
    const inicialResults: DispatchResult[] = [];
    const lembreteResults: DispatchResult[] = [];
    const errors: Array<{ contractId: number; eventoId: number; message: string; step: FollowupStep }> =
      [];

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

    if (withinBusinessHours) {
      const { data: pendingInicial, error: inicialQueryError } = await supabase
        .from("evento_contracts")
        .select("id, evento_id, generated_at, tenant_id")
        .eq("status", "generated")
        .eq("assinatura_followup_status", "ativo")
        .is("assinatura_followup_inicial_enviado_em", null);

      if (inicialQueryError) throw inicialQueryError;

      const eligibleInicial = (pendingInicial ?? []).filter((contract) => {
        if (typeof contract.generated_at !== "string") return false;
        return hoursSince(contract.generated_at, now) >= CONTRACT_SIGNATURE_FOLLOWUP_INICIAL_DELAY_HOURS;
      });

      for (const contract of eligibleInicial) {
        const tenantId = contract.tenant_id as number;
        const eventoId = contract.evento_id as number;
        const contractId = contract.id as number;

        try {
          const tenant = await loadTenant(tenantId);
          if (!tenant) {
            inicialResults.push({
              contractId,
              dispatched: false,
              eventoId,
              skippedReason: "Tenant não encontrado para follow-up.",
            });
            continue;
          }

          const result = await dispatchContractSignatureFollowup(supabase, {
            contractId,
            eventoId,
            step: "inicial",
            tenant,
            triggeredAt: nowIso,
          });

          inicialResults.push({
            contractId,
            dispatched: result.dispatched,
            eventoId,
            skippedReason: result.skippedReason,
          });

          if (!result.dispatched && result.errorMessage) {
            errors.push({
              contractId,
              eventoId,
              message: result.errorMessage,
              step: "inicial",
            });
          }
        } catch (error) {
          errors.push({
            contractId,
            eventoId,
            message: error instanceof Error ? error.message : "Erro ao disparar follow-up inicial.",
            step: "inicial",
          });
        }
      }

      const { data: pendingLembrete, error: lembreteQueryError } = await supabase
        .from("evento_contracts")
        .select("id, evento_id, assinatura_followup_ultimo_enviado_em, tenant_id")
        .eq("status", "generated")
        .eq("assinatura_followup_status", "ativo")
        .not("assinatura_followup_inicial_enviado_em", "is", null);

      if (lembreteQueryError) throw lembreteQueryError;

      const eligibleLembrete = (pendingLembrete ?? []).filter((contract) => {
        if (typeof contract.assinatura_followup_ultimo_enviado_em !== "string") return false;
        return (
          hoursSince(contract.assinatura_followup_ultimo_enviado_em, now) >=
          CONTRACT_SIGNATURE_FOLLOWUP_LEMBRETE_DELAY_HOURS
        );
      });

      for (const contract of eligibleLembrete) {
        const tenantId = contract.tenant_id as number;
        const eventoId = contract.evento_id as number;
        const contractId = contract.id as number;

        try {
          const tenant = await loadTenant(tenantId);
          if (!tenant) {
            lembreteResults.push({
              contractId,
              dispatched: false,
              eventoId,
              skippedReason: "Tenant não encontrado para follow-up.",
            });
            continue;
          }

          const result = await dispatchContractSignatureFollowup(supabase, {
            contractId,
            eventoId,
            step: "lembrete",
            tenant,
            triggeredAt: nowIso,
          });

          lembreteResults.push({
            contractId,
            dispatched: result.dispatched,
            eventoId,
            skippedReason: result.skippedReason,
          });

          if (!result.dispatched && result.errorMessage) {
            errors.push({
              contractId,
              eventoId,
              message: result.errorMessage,
              step: "lembrete",
            });
          }
        } catch (error) {
          errors.push({
            contractId,
            eventoId,
            message: error instanceof Error ? error.message : "Erro ao disparar lembrete.",
            step: "lembrete",
          });
        }
      }
    }

    return jsonResponse({
      errors,
      inicial: {
        delayHours: CONTRACT_SIGNATURE_FOLLOWUP_INICIAL_DELAY_HOURS,
        dispatched: inicialResults.filter((item) => item.dispatched).length,
        results: inicialResults,
        skippedBusinessHours: !withinBusinessHours,
      },
      lembrete: {
        delayHours: CONTRACT_SIGNATURE_FOLLOWUP_LEMBRETE_DELAY_HOURS,
        dispatched: lembreteResults.filter((item) => item.dispatched).length,
        results: lembreteResults,
        skippedBusinessHours: !withinBusinessHours,
      },
      processedAt: nowIso,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado.";
    console.error("[process-contract-signature-followups]", message);
    return jsonResponse({ error: message }, 500);
  }
});
