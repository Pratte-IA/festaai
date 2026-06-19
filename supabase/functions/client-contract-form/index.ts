import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EVENTO_FIELD_KEYS = new Set([
  "cliente_nome",
  "cliente_telefone",
  "cliente_email",
  "cliente_cpf",
  "cliente_cep",
  "cliente_rua",
  "cliente_numero",
  "cliente_bairro",
  "cliente_cidade",
  "cliente_estado",
  "aniversariante_nome",
  "aniversariante_data_nascimento",
  "data_evento",
  "hora_evento",
  "quantidade_convidados",
  "pacote_nome",
  "pacote_convidados_inclusos",
  "valor_pacote",
  "valor_adicionais",
  "valor_total",
  "valor_entrada",
  "valor_saldo",
  "forma_pagamento_entrada",
  "forma_pagamento_saldo",
  "parcelas",
  "data_limite_pagamento",
  "observacoes",
]);

const loadSchema = z.object({
  action: z.literal("load"),
  tenantSlug: z.string().min(2).max(80),
});

const submitFieldSchema = z.object({
  fieldKey: z.string().nullable(),
  fieldType: z.string(),
  id: z.string(),
  required: z.boolean(),
});

const submitSchema = z.object({
  acceptanceResponses: z
    .array(
      z.object({
        accepted: z.boolean(),
        termId: z.number().int().positive(),
      }),
    )
    .optional()
    .default([]),
  action: z.literal("submit"),
  adicionaisSnapshot: z.unknown().optional().nullable(),
  fieldValues: z.record(z.string()),
  fields: z.array(submitFieldSchema).min(1),
  pacoteId: z.number().int().positive().nullable().optional(),
  packageEventoUpdates: z
    .object({
      pacote_convidados_inclusos: z.number().nullable().optional(),
      pacote_nome: z.string().optional(),
      valor_pacote: z.number().optional(),
    })
    .optional(),
  tenantSlug: z.string().min(2).max(80),
});

const requestSchema = z.discriminatedUnion("action", [loadSchema, submitSchema]);

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

const normalizePhoneDigits = (phone: string | null | undefined): string => (phone ?? "").replace(/\D/g, "");

const phonesMatch = (left: string | null | undefined, right: string | null | undefined): boolean => {
  const a = normalizePhoneDigits(left);
  const b = normalizePhoneDigits(right);
  if (!a || !b) return false;
  if (a === b) return true;

  const suffixA = a.length > 11 && a.startsWith("55") ? a.slice(2) : a;
  const suffixB = b.length > 11 && b.startsWith("55") ? b.slice(2) : b;
  if (suffixA === suffixB) return true;

  const coreA = suffixA.length >= 10 ? suffixA.slice(-10) : suffixA;
  const coreB = suffixB.length >= 10 ? suffixB.slice(-10) : suffixB;
  return coreA.length >= 10 && coreA === coreB;
};

const applyFieldValueToEvento = (
  eventoUpdates: Record<string, unknown>,
  fieldKey: string,
  fieldType: string,
  value: string,
) => {
  switch (fieldType) {
    case "number":
      eventoUpdates[fieldKey] = value === "" ? null : Number(value);
      break;
    case "currency":
      eventoUpdates[fieldKey] = value === "" ? 0 : Number(value);
      break;
    default:
      eventoUpdates[fieldKey] = value === "" ? null : value;
  }
};

const resolveFunnelStageAfterClientForm = (funil: string) => {
  if (funil !== "vendas") return null;
  return {
    etapa: "boas_vindas",
    funil: "festa",
    status_interno: "ativo" as const,
  };
};

const resolveTenant = async (
  admin: ReturnType<typeof createClient>,
  tenantSlug: string,
) => {
  const { data, error } = await admin
    .from("tenants")
    .select("id, name, slug, status")
    .eq("slug", tenantSlug)
    .maybeSingle();

  if (error) throw error;
  if (!data || data.status !== "active") return null;
  return data;
};

const handleLoad = async (admin: ReturnType<typeof createClient>, tenantSlug: string) => {
  const tenant = await resolveTenant(admin, tenantSlug);
  if (!tenant) {
    return jsonResponse({ error: "Espaço não encontrado." }, 404);
  }

  const [fieldsResult, termsResult, packagesResult, additionalsResult, paymentMethodsResult, financialResult] =
    await Promise.all([
      admin
        .from("tenant_closing_form_fields")
        .select(
          "id, section, label, field_key, field_type, required, active, sort_order, is_system, description, config, category",
        )
        .eq("tenant_id", tenant.id)
        .eq("active", true)
        .order("section", { ascending: true })
        .order("sort_order", { ascending: true }),
      admin
        .from("tenant_acceptance_terms")
        .select("id, title, content, is_required, active, sort_order, appears_in_contract")
        .eq("tenant_id", tenant.id)
        .eq("active", true)
        .order("sort_order", { ascending: true }),
      admin
        .from("tenant_packages")
        .select(
          "id, name, description, active, included_guests, pricing_tiers, included_items, excluded_items, buffet, equipe, estrutura, duration_minutes, rules, sort_order",
        )
        .eq("tenant_id", tenant.id)
        .eq("active", true)
        .order("sort_order", { ascending: true }),
      admin
        .from("tenant_additionals")
        .select("id, name, description, category, type, price, active, sort_order, is_required, package_ids")
        .eq("tenant_id", tenant.id)
        .eq("active", true)
        .order("sort_order", { ascending: true }),
      admin
        .from("tenant_payment_methods")
        .select("id, name, type, active, allowed_for_deposit, allowed_for_remaining_balance, sort_order")
        .eq("tenant_id", tenant.id)
        .eq("active", true)
        .order("sort_order", { ascending: true }),
      admin
        .from("tenant_financial_settings")
        .select("*")
        .eq("tenant_id", tenant.id)
        .maybeSingle(),
    ]);

  if (fieldsResult.error) throw fieldsResult.error;
  if (termsResult.error) throw termsResult.error;
  if (packagesResult.error) throw packagesResult.error;
  if (additionalsResult.error) throw additionalsResult.error;
  if (paymentMethodsResult.error) throw paymentMethodsResult.error;
  if (financialResult.error) throw financialResult.error;

  return jsonResponse({
    acceptanceTerms: (termsResult.data ?? []).map((term) => ({
      active: term.active,
      appearsInContract: term.appears_in_contract,
      content: term.content,
      id: String(term.id),
      isRequired: term.is_required,
      sortOrder: term.sort_order,
      title: term.title,
    })),
    additionals: (additionalsResult.data ?? []).map((item) => ({
      active: item.active,
      category: item.category,
      description: item.description,
      id: String(item.id),
      isRequired: false,
      name: item.name,
      packageIds: (item.package_ids ?? []).map(String),
      price: item.price,
      sortOrder: item.sort_order,
      type: item.type,
    })),
    fields: (fieldsResult.data ?? []).map((field) => ({
      active: field.active,
      category: field.category ?? "operacional",
      config: field.config ?? {},
      description: field.description,
      fieldKey: field.field_key,
      fieldType: field.field_type,
      id: String(field.id),
      isSystem: field.is_system,
      label: field.label,
      required: field.required,
      section: field.section,
      sortOrder: field.sort_order,
    })),
    financialSettings: financialResult.data,
    packages: (packagesResult.data ?? []).map((pkg) => ({
      active: pkg.active,
      buffet: pkg.buffet,
      description: pkg.description ?? "",
      durationMinutes: pkg.duration_minutes,
      equipe: pkg.equipe,
      estrutura: pkg.estrutura,
      excludedItems: pkg.excluded_items,
      id: String(pkg.id),
      includedGuests: pkg.included_guests,
      includedItems: pkg.included_items,
      name: pkg.name,
      pricingTiers: pkg.pricing_tiers,
      rules: pkg.rules,
      sortOrder: pkg.sort_order,
    })),
    paymentMethods: (paymentMethodsResult.data ?? []).map((method) => ({
      allowedForDeposit: method.allowed_for_deposit,
      allowedForRemainingBalance: method.allowed_for_remaining_balance,
      id: String(method.id),
      name: method.name,
      sortOrder: method.sort_order,
      type: method.type,
    })),
    tenantName: tenant.name,
    tenantSlug: tenant.slug,
  });
};

const handleSubmit = async (
  admin: ReturnType<typeof createClient>,
  payload: z.infer<typeof submitSchema>,
) => {
  const tenant = await resolveTenant(admin, payload.tenantSlug);
  if (!tenant) {
    return jsonResponse({ error: "Espaço não encontrado." }, 404);
  }

  const phoneField = payload.fields.find((field) => field.fieldKey === "cliente_telefone");
  const phoneValue = phoneField ? (payload.fieldValues[phoneField.id] ?? "").trim() : "";

  if (!phoneValue || normalizePhoneDigits(phoneValue).length < 10) {
    return jsonResponse({ error: "Informe um telefone válido para identificar seu cadastro." }, 400);
  }

  const { data: vendasEventos, error: eventosError } = await admin
    .from("eventos")
    .select("id, funil, etapa, cliente_telefone, updated_at, status_interno")
    .eq("tenant_id", tenant.id)
    .eq("funil", "vendas")
    .order("updated_at", { ascending: false });

  if (eventosError) throw eventosError;

  const matchedEvento = (vendasEventos ?? []).find((evento) => phonesMatch(evento.cliente_telefone, phoneValue));

  if (!matchedEvento) {
    return jsonResponse(
      {
        error:
          "Não encontramos um lead em Vendas com este telefone. Confira o número ou fale com a equipe do espaço.",
      },
      404,
    );
  }

  const eventoUpdates: Record<string, unknown> = {};
  const customResponses: Array<{ field_id: number; value: string }> = [];

  payload.fields.forEach((field) => {
    const value = payload.fieldValues[field.id] ?? "";

    if (field.fieldKey && EVENTO_FIELD_KEYS.has(field.fieldKey)) {
      if (
        payload.packageEventoUpdates &&
        (field.fieldKey === "pacote_nome" ||
          field.fieldKey === "valor_pacote" ||
          field.fieldKey === "pacote_convidados_inclusos")
      ) {
        return;
      }

      applyFieldValueToEvento(eventoUpdates, field.fieldKey, field.fieldType, value);
      return;
    }

    customResponses.push({
      field_id: Number(field.id),
      value,
    });
  });

  if (payload.packageEventoUpdates) {
    Object.assign(eventoUpdates, payload.packageEventoUpdates);
  }

  const pacoteValue =
    payload.packageEventoUpdates?.valor_pacote ??
    Number(payload.fieldValues[payload.fields.find((field) => field.fieldKey === "valor_pacote")?.id ?? ""] || 0);
  const adicionaisValue = Number(
    payload.fieldValues[payload.fields.find((field) => field.fieldKey === "valor_adicionais")?.id ?? ""] || 0,
  );
  const entradaValue = Number(
    payload.fieldValues[payload.fields.find((field) => field.fieldKey === "valor_entrada")?.id ?? ""] || 0,
  );

  if (pacoteValue || adicionaisValue) {
    eventoUpdates.valor_total = Number(pacoteValue || 0) + Number(adicionaisValue || 0);
  }

  const saldoFieldId = payload.fields.find((field) => field.fieldKey === "valor_saldo")?.id;
  if (saldoFieldId) {
    eventoUpdates.valor_saldo = Number(payload.fieldValues[saldoFieldId] || 0);
  } else if (eventoUpdates.valor_total !== undefined) {
    eventoUpdates.valor_saldo = Math.max(Number(eventoUpdates.valor_total || 0) - entradaValue, 0);
  }

  if (payload.pacoteId != null) {
    eventoUpdates.pacote_id = payload.pacoteId;
  }

  if (payload.adicionaisSnapshot != null) {
    eventoUpdates.adicionais_snapshot = payload.adicionaisSnapshot;
  }

  const funnelMigration = resolveFunnelStageAfterClientForm(matchedEvento.funil);
  const now = new Date().toISOString();

  if (funnelMigration) {
    eventoUpdates.funil = funnelMigration.funil;
    eventoUpdates.etapa = funnelMigration.etapa;
    eventoUpdates.status_interno = funnelMigration.status_interno;
    eventoUpdates.fechamento_confirmado_em = now;
    eventoUpdates.boas_vindas_whatsapp_agendado_em = now;
    eventoUpdates.motivo_perda = null;
  }

  const { data: updatedEvento, error: updateError } = await admin
    .from("eventos")
    .update(eventoUpdates)
    .eq("id", matchedEvento.id)
    .eq("tenant_id", tenant.id)
    .select("id, funil, etapa")
    .single();

  if (updateError) throw updateError;

  if (customResponses.length > 0) {
    const { error: responsesError } = await admin.from("evento_closing_responses").upsert(
      customResponses.map((response) => ({
        evento_id: matchedEvento.id,
        field_id: response.field_id,
        tenant_id: tenant.id,
        value: response.value,
      })),
      { onConflict: "evento_id,field_id" },
    );

    if (responsesError) throw responsesError;
  }

  if (payload.acceptanceResponses.length > 0) {
    const { error: acceptanceError } = await admin.from("evento_acceptance_responses").upsert(
      payload.acceptanceResponses.map((response) => ({
        accepted: true,
        accepted_at: now,
        evento_id: matchedEvento.id,
        tenant_id: tenant.id,
        term_id: response.termId,
      })),
      { onConflict: "evento_id,term_id" },
    );

    if (acceptanceError) throw acceptanceError;
  } else {
    const { data: activeTerms, error: termsError } = await admin
      .from("tenant_acceptance_terms")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("active", true);

    if (termsError) throw termsError;

    if ((activeTerms ?? []).length > 0) {
      const { error: acceptanceError } = await admin.from("evento_acceptance_responses").upsert(
        activeTerms.map((term) => ({
          accepted: true,
          accepted_at: now,
          evento_id: matchedEvento.id,
          tenant_id: tenant.id,
          term_id: term.id,
        })),
        { onConflict: "evento_id,term_id" },
      );

      if (acceptanceError) throw acceptanceError;
    }
  }

  return jsonResponse({
    advancedToFesta: updatedEvento.funil === "festa" && updatedEvento.etapa === "boas_vindas",
    eventoId: updatedEvento.id,
    etapa: updatedEvento.etapa,
    funil: updatedEvento.funil,
    message: "Formulário recebido e contrato aceito. Em breve entraremos em contato!",
    whatsappDispatchScheduled: Boolean(funnelMigration),
  });
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const admin = createClient(
      requiredEnv("SUPABASE_URL"),
      requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return jsonResponse({ error: "Dados inválidos.", details: parsed.error.flatten() }, 400);
    }

    if (parsed.data.action === "load") {
      return await handleLoad(admin, parsed.data.tenantSlug);
    }

    return await handleSubmit(admin, parsed.data);
  } catch (error) {
    console.error("client-contract-form error", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Erro interno ao processar o formulário." },
      500,
    );
  }
});
