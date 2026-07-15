import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

import {
  getBrazilMobilePhoneValidationError,
  phonesMatch,
} from "../_shared/phone.ts";
import { formatCompanyDisplayName } from "../_shared/company-display-name.ts";
import { dispatchSatisfactionSurveyNpsBaixa } from "../_shared/dispatch-satisfaction-survey-nps-baixa.ts";
import {
  isPostPartyAutomationActive,
  POST_PARTY_AUTOMATION_EFFECTIVE_DATE,
} from "../_shared/post-party-automation.ts";
import {
  extractSatisfactionSurveyNpsScore,
  shouldDispatchSatisfactionSurveyNpsBaixa,
} from "../_shared/satisfaction-survey-nps-baixa-message.ts";

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const COMPANY_PLACEHOLDER = "{{nome_empresa}}";

/**
 * Etapas do funil "executadas" em que a pesquisa permanece respondível enquanto
 * ainda não foi preenchida. Inclui "redes_sociais" porque a equipe pode avançar
 * o card manualmente no CRM antes de o cliente responder.
 */
const SURVEY_OPEN_STAGES = ["aguardando_feedback", "redes_sociais"];

const isSurveyStageOpen = (funil: unknown, etapa: unknown): boolean =>
  funil === "executadas" && typeof etapa === "string" && SURVEY_OPEN_STAGES.includes(etapa);

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

const loadSchema = z.object({
  action: z.literal("load"),
  clientPhone: z.string().min(8).max(30),
  eventoId: z.number().int().positive(),
  tenantSlug: z.string().min(2).max(80),
});

const submitSchema = z.object({
  action: z.literal("submit"),
  clientPhone: z.string().min(8).max(30),
  eventoId: z.number().int().positive(),
  responses: z.record(z.string()),
  tenantSlug: z.string().min(2).max(80),
});

const requestSchema = z.discriminatedUnion("action", [loadSchema, submitSchema]);

type SurveyQuestionRow = {
  active: boolean;
  config: Record<string, unknown> | null;
  id: number;
  label: string;
  question_key: string | null;
  question_type: string;
  required: boolean;
  sort_order: number;
};

const resolveTenant = async (
  admin: ReturnType<typeof createClient>,
  tenantSlug: string,
) => {
  const { data, error } = await admin
    .from("tenants")
    .select("id, name, slug")
    .eq("slug", tenantSlug)
    .maybeSingle();

  if (error) throw error;
  return data;
};

const resolveCompanyName = async (
  admin: ReturnType<typeof createClient>,
  tenantId: number,
  fallbackName: string,
) => {
  const { data, error } = await admin
    .from("tenant_company_profiles")
    .select("company_name")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) throw error;

  const companyName = typeof data?.company_name === "string" ? data.company_name.trim() : "";
  const resolved = companyName || fallbackName;
  return formatCompanyDisplayName(resolved);
};

const resolveSurveyLabel = (label: string, companyName: string) =>
  label.replaceAll(COMPANY_PLACEHOLDER, companyName);

const mapPublicQuestion = (row: SurveyQuestionRow, companyName: string) => {
  const config = row.config ?? {};

  if (row.question_type === "scale") {
    const min = typeof config.min === "number" ? config.min : 0;
    const max = typeof config.max === "number" ? config.max : 10;
    return {
      config: { max, min },
      id: String(row.id),
      label: resolveSurveyLabel(row.label, companyName),
      questionType: row.question_type,
      required: row.required,
      sortOrder: row.sort_order,
    };
  }

  if (row.question_type === "single_choice") {
    const options = Array.isArray(config.options)
      ? config.options.filter((option): option is string =>
        typeof option === "string" && option.trim().length > 0
      )
      : [];

    return {
      config: { options },
      id: String(row.id),
      label: resolveSurveyLabel(row.label, companyName),
      questionType: row.question_type,
      required: row.required,
      sortOrder: row.sort_order,
    };
  }

  return {
    config: {},
    id: String(row.id),
    label: resolveSurveyLabel(row.label, companyName),
    questionType: row.question_type,
    required: row.required,
    sortOrder: row.sort_order,
  };
};

const loadEventoForSurvey = async (
  admin: ReturnType<typeof createClient>,
  tenantId: number,
  eventoId: number,
) => {
  const { data, error } = await admin
    .from("eventos")
    .select(
      "id, aniversariante_nome, cliente_nome, cliente_telefone, data_evento, etapa, funil, satisfaction_survey_preenchido_em",
    )
    .eq("tenant_id", tenantId)
    .eq("id", eventoId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

const validateSurveyResponses = (
  questions: SurveyQuestionRow[],
  responses: Record<string, string>,
): string | null => {
  for (const question of questions) {
    if (!question.active || !question.required) continue;

    const value = (responses[String(question.id)] ?? "").trim();
    if (!value) {
      return `Responda a pergunta obrigatória: ${question.label}`;
    }

    if (question.question_type === "scale") {
      const numeric = Number(value);
      const config = question.config ?? {};
      const min = typeof config.min === "number" ? config.min : 0;
      const max = typeof config.max === "number" ? config.max : 10;
      if (!Number.isInteger(numeric) || numeric < min || numeric > max) {
        return `Nota inválida para: ${question.label}`;
      }
    }

    if (question.question_type === "single_choice") {
      const config = question.config ?? {};
      const options = Array.isArray(config.options)
        ? config.options.filter((option): option is string => typeof option === "string")
        : [];
      if (!options.includes(value)) {
        return `Opção inválida para: ${question.label}`;
      }
    }
  }

  return null;
};

const handleLoad = async (
  admin: ReturnType<typeof createClient>,
  payload: z.infer<typeof loadSchema>,
) => {
  if (!isPostPartyAutomationActive()) {
    return jsonResponse({
      error: `A pesquisa de avaliação estará disponível a partir de ${POST_PARTY_AUTOMATION_EFFECTIVE_DATE.split("-").reverse().join("/")}.`,
    }, 403);
  }

  const phoneError = getBrazilMobilePhoneValidationError(payload.clientPhone);
  if (phoneError) {
    return jsonResponse({ error: phoneError }, 400);
  }

  const tenant = await resolveTenant(admin, payload.tenantSlug);
  if (!tenant) {
    return jsonResponse({ error: "Espaço não encontrado." }, 404);
  }

  const evento = await loadEventoForSurvey(admin, tenant.id, payload.eventoId);
  if (!evento) {
    return jsonResponse({ error: "Festa não encontrada." }, 404);
  }

  if (!phonesMatch(evento.cliente_telefone, payload.clientPhone)) {
    return jsonResponse({ error: "Telefone não confere com o cadastro desta festa." }, 403);
  }

  if (evento.satisfaction_survey_preenchido_em) {
    return jsonResponse({
      alreadySubmitted: true,
      clientName: evento.cliente_nome,
      message: "Esta pesquisa já foi respondida. Obrigado!",
      partyDate: evento.data_evento,
      submittedAt: evento.satisfaction_survey_preenchido_em,
    });
  }

  if (!isSurveyStageOpen(evento.funil, evento.etapa)) {
    return jsonResponse({
      error: "Esta pesquisa ainda não está disponível para esta festa.",
    }, 400);
  }

  const companyName = await resolveCompanyName(admin, tenant.id, tenant.name);

  const { data: questionRows, error: questionsError } = await admin
    .from("tenant_satisfaction_survey_questions")
    .select("id, label, question_key, question_type, required, active, sort_order, config")
    .eq("tenant_id", tenant.id)
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (questionsError) throw questionsError;

  const questions = (questionRows ?? []).map((row) =>
    mapPublicQuestion(row as SurveyQuestionRow, companyName)
  );

  if (questions.length === 0) {
    return jsonResponse({ error: "Este espaço ainda não configurou a pesquisa de avaliação." }, 400);
  }

  const { data: savedRows, error: savedError } = await admin
    .from("evento_satisfaction_responses")
    .select("question_id, value")
    .eq("tenant_id", tenant.id)
    .eq("evento_id", payload.eventoId);

  if (savedError) throw savedError;

  const savedResponses: Record<string, string> = {};
  (savedRows ?? []).forEach((row) => {
    savedResponses[String(row.question_id)] = row.value ?? "";
  });

  return jsonResponse({
    aniversarianteNome: evento.aniversariante_nome,
    clientName: evento.cliente_nome,
    companyName,
    partyDate: evento.data_evento,
    questions,
    savedResponses,
    tenantName: tenant.name,
    tenantSlug: tenant.slug,
    title: "Pesquisa de satisfação — Festa Infantil",
  });
};

const handleSubmit = async (
  admin: ReturnType<typeof createClient>,
  payload: z.infer<typeof submitSchema>,
) => {
  if (!isPostPartyAutomationActive()) {
    return jsonResponse({
      error: `A pesquisa de avaliação estará disponível a partir de ${POST_PARTY_AUTOMATION_EFFECTIVE_DATE.split("-").reverse().join("/")}.`,
    }, 403);
  }

  const phoneError = getBrazilMobilePhoneValidationError(payload.clientPhone);
  if (phoneError) {
    return jsonResponse({ error: phoneError }, 400);
  }

  const tenant = await resolveTenant(admin, payload.tenantSlug);
  if (!tenant) {
    return jsonResponse({ error: "Espaço não encontrado." }, 404);
  }

  const evento = await loadEventoForSurvey(admin, tenant.id, payload.eventoId);
  if (!evento) {
    return jsonResponse({ error: "Festa não encontrada." }, 404);
  }

  if (!phonesMatch(evento.cliente_telefone, payload.clientPhone)) {
    return jsonResponse({ error: "Telefone não confere com o cadastro desta festa." }, 403);
  }

  if (evento.satisfaction_survey_preenchido_em) {
    return jsonResponse({ error: "Esta pesquisa já foi respondida." }, 400);
  }

  if (!isSurveyStageOpen(evento.funil, evento.etapa)) {
    return jsonResponse({ error: "Esta pesquisa ainda não está disponível para esta festa." }, 400);
  }

  const { data: questionRows, error: questionsError } = await admin
    .from("tenant_satisfaction_survey_questions")
    .select("id, label, question_key, question_type, required, active, sort_order, config")
    .eq("tenant_id", tenant.id)
    .eq("active", true);

  if (questionsError) throw questionsError;

  const activeQuestions = (questionRows ?? []) as SurveyQuestionRow[];
  const validationError = validateSurveyResponses(activeQuestions, payload.responses);
  if (validationError) {
    return jsonResponse({ error: validationError }, 400);
  }

  const now = new Date().toISOString();
  const responseRows = activeQuestions
    .map((question) => {
      const value = (payload.responses[String(question.id)] ?? "").trim();
      if (!value) return null;

      return {
        created_at: now,
        evento_id: payload.eventoId,
        question_id: question.id,
        tenant_id: tenant.id,
        updated_at: now,
        value,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  if (responseRows.length > 0) {
    const { error: upsertError } = await admin
      .from("evento_satisfaction_responses")
      .upsert(responseRows, { onConflict: "evento_id,question_id" });

    if (upsertError) throw upsertError;
  }

  const { error: eventoUpdateError } = await admin
    .from("eventos")
    .update({
      etapa: "redes_sociais",
      funil: "executadas",
      satisfaction_survey_preenchido_em: now,
    })
    .eq("tenant_id", tenant.id)
    .eq("id", payload.eventoId)
    .in("etapa", SURVEY_OPEN_STAGES)
    .is("satisfaction_survey_preenchido_em", null);

  if (eventoUpdateError) throw eventoUpdateError;

  const npsScore = extractSatisfactionSurveyNpsScore(activeQuestions, payload.responses);
  if (shouldDispatchSatisfactionSurveyNpsBaixa(npsScore) && npsScore != null) {
    try {
      const npsBaixaResult = await dispatchSatisfactionSurveyNpsBaixa(admin, {
        eventoId: payload.eventoId,
        npsScore,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
        },
        triggeredAt: now,
      });

      if (!npsBaixaResult.dispatched) {
        console.warn("[client-satisfaction-survey] nps_baixa skipped/failed", {
          errorMessage: npsBaixaResult.errorMessage,
          eventoId: payload.eventoId,
          npsScore,
          skippedReason: npsBaixaResult.skippedReason,
          tenantId: tenant.id,
        });
      }
    } catch (npsBaixaError) {
      const message =
        npsBaixaError instanceof Error ? npsBaixaError.message : "Erro no follow-up NPS baixa.";
      console.error("[client-satisfaction-survey] nps_baixa error", message);
    }
  }

  return jsonResponse({
    advancedToRedesSociais: true,
    etapa: "redes_sociais",
    funil: "executadas",
    message: "Obrigado por compartilhar sua experiência! Sua avaliação foi registrada.",
    submittedAt: now,
  });
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return jsonResponse({ error: "Requisição inválida." }, 400);
    }

    const admin = createClient(requiredEnv("SUPABASE_URL"), requiredEnv("SUPABASE_SERVICE_ROLE_KEY"));

    if (parsed.data.action === "load") {
      return await handleLoad(admin, parsed.data);
    }

    return await handleSubmit(admin, parsed.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado.";
    console.error("[client-satisfaction-survey]", message);
    return jsonResponse({ error: message }, 500);
  }
});
