import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

import {
  buildContractNumber,
  buildEventoContract,
  CONTRACT_ACCEPTANCE_DECLARATION,
  parseTenantContractTemplateParams,
} from "../_shared/evento-contract-builder.ts";
import { loadTenantContractTemplateForGeneration } from "../_shared/load-tenant-contract-template.ts";
import { dispatchBoasVindasAfterContractSigned } from "../_shared/dispatch-boas-vindas.ts";
import { computeClosingFormValorSaldo } from "../_shared/event-financial.ts";
import { buildPhoneLookupVariants } from "../_shared/phone-lookup.ts";
import {
  resolveFunnelStageAfterContractAcceptance,
  resolveFunnelStagePendingContractSignature,
} from "../_shared/funnel-stage-client-form.ts";
import {
  findDuplicateVendasLeads,
  resolveFunnelLeadMatch,
  type FunnelLeadCandidate,
} from "../_shared/resolve-funnel-lead-match.ts";
import {
  getBrazilMobilePhoneValidationError,
  normalizeBrazilMobilePhoneForStorage,
  phonesMatch,
} from "../_shared/phone.ts";

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
  "hora_termino",
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
  balancePaymentSchedule: z.enum(["7_dias_antes", "mensal"]).nullable().optional(),
  fieldValues: z.record(z.string()),
  fields: z.array(submitFieldSchema).min(1),
  linkedEventoId: z.number().int().positive().nullable().optional(),
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

const acceptContractSchema = z.object({
  acceptedByCpf: z.string().optional(),
  acceptedByEmail: z.string().optional(),
  acceptedByName: z.string().min(2).max(200),
  acceptedByPhone: z.string().optional(),
  acceptanceText: z.string().min(10).max(2000).optional(),
  action: z.literal("accept_contract"),
  clientPhone: z.string().min(8).max(30),
  contractId: z.number().int().positive(),
  eventoId: z.number().int().positive(),
  tenantSlug: z.string().min(2).max(80),
  termAcceptances: z
    .array(
      z.object({
        accepted: z.boolean(),
        termId: z.number().int().positive(),
      }),
    )
    .default([]),
});

const requestSchema = z.discriminatedUnion("action", [
  loadSchema,
  submitSchema,
  acceptContractSchema,
]);

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });

const resolveRuntimeErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Erro interno ao processar o formulário.";
};

const requiredEnv = (key: string) => {
  const value = Deno.env.get(key);
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

const resolveClientIp = (request: Request): string | null => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const cfIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cfIp) return cfIp;

  return null;
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

const EVENTO_MATCH_SELECT =
  "id, funil, etapa, cliente_nome, cliente_email, cliente_telefone, updated_at, status_interno";

const loadFunnelLeadCandidates = async (
  admin: ReturnType<typeof createClient>,
  tenantId: number,
  options: {
    clientName: string | null;
    linkedEventoId: number | null;
    normalizedPhone: string;
  },
): Promise<FunnelLeadCandidate[]> => {
  const candidates = new Map<number, FunnelLeadCandidate>();

  const addRows = (rows: FunnelLeadCandidate[] | null | undefined) => {
    for (const row of rows ?? []) {
      candidates.set(row.id, row);
    }
  };

  if (options.linkedEventoId) {
    const { data, error } = await admin
      .from("eventos")
      .select(EVENTO_MATCH_SELECT)
      .eq("tenant_id", tenantId)
      .eq("id", options.linkedEventoId)
      .maybeSingle();

    if (error) throw error;
    if (data) candidates.set(data.id, data as FunnelLeadCandidate);
  }

  const phoneVariants = buildPhoneLookupVariants(options.normalizedPhone);
  if (phoneVariants.length > 0) {
    const { data, error } = await admin
      .from("eventos")
      .select(EVENTO_MATCH_SELECT)
      .eq("tenant_id", tenantId)
      .in("funil", ["vendas", "festa"])
      .in("cliente_telefone", phoneVariants);

    if (error) throw error;

    addRows(
      (data ?? []).filter((row) =>
        phonesMatch(row.cliente_telefone, options.normalizedPhone),
      ) as FunnelLeadCandidate[],
    );
  }

  const sanitizedName = options.clientName?.replace(/[%_]/g, "").trim();
  if (sanitizedName && sanitizedName.length >= 3) {
    const { data, error } = await admin
      .from("eventos")
      .select(EVENTO_MATCH_SELECT)
      .eq("tenant_id", tenantId)
      .in("funil", ["vendas", "festa"])
      .ilike("cliente_nome", sanitizedName);

    if (error) throw error;
    addRows(data as FunnelLeadCandidate[]);
  }

  return [...candidates.values()];
};

const archiveDuplicateVendasLeads = async (
  admin: ReturnType<typeof createClient>,
  tenantId: number,
  festaEventoId: number,
  funnelEventos: Array<{
    cliente_email: string | null;
    cliente_nome: string;
    cliente_telefone: string | null;
    etapa: string;
    funil: string;
    id: number;
    status_interno: string;
    updated_at: string;
  }>,
  criteria: {
    email: string | null;
    name: string | null;
    phone: string | null;
  },
) => {
  const duplicates = findDuplicateVendasLeads(funnelEventos, criteria, festaEventoId);
  if (duplicates.length === 0) return;

  for (const duplicate of duplicates) {
    const { error: updateError } = await admin
      .from("eventos")
      .update({
        etapa: "perdido",
        motivo_perda: `Lead consolidado no evento #${festaEventoId} (formulário de contratação).`,
        status_interno: "cancelado",
      })
      .eq("tenant_id", tenantId)
      .eq("id", duplicate.id);

    if (updateError) throw updateError;

    await admin.from("evento_notas").insert({
      evento_id: duplicate.id,
      tenant_id: tenantId,
      texto:
        `[Automação] Lead duplicado arquivado após fechamento no evento festa #${festaEventoId}. ` +
        "O cadastro ativo permanece no funil Festa.",
    });
  }
};

const PUBLIC_FORM_BLOCKED_TENANT_STATUSES = new Set(["canceled", "suspended"]);

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
  // Alinhado a canAccessTenantApp: trial e past_due podem usar o formulário público.
  if (!data || PUBLIC_FORM_BLOCKED_TENANT_STATUSES.has(String(data.status))) return null;
  return data;
};

const mapPublicTerm = (term: Record<string, unknown>) => ({
  active: Boolean(term.active),
  appearsInContract: Boolean(term.appears_in_contract),
  content: String(term.content),
  id: String(term.id),
  isRequired: Boolean(term.is_required),
  showAtSigning: Boolean(term.show_at_signing),
  showInForm: Boolean(term.show_in_form),
  sortOrder: Number(term.sort_order ?? 0),
  termKey: typeof term.term_key === "string" ? term.term_key : null,
  title: String(term.title),
});

const generateEventoContractForPublicFlow = async (
  admin: ReturnType<typeof createClient>,
  tenantId: number,
  eventoId: number,
) => {
  const [
    eventoResult,
    closingFieldsResult,
    closingResponsesResult,
    acceptanceTermsResult,
    acceptanceResponsesResult,
    financialResult,
    existingContractsResult,
    pendingGeneratedResult,
    companyProfileResult,
    moduleSettingsResult,
  ] = await Promise.all([
    admin.from("eventos").select("*").eq("tenant_id", tenantId).eq("id", eventoId).maybeSingle(),
    admin.from("tenant_closing_form_fields").select("*").eq("tenant_id", tenantId),
    admin
      .from("evento_closing_responses")
      .select("field_id, value")
      .eq("tenant_id", tenantId)
      .eq("evento_id", eventoId),
    admin
      .from("tenant_acceptance_terms")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("active", true)
      .order("sort_order", { ascending: true }),
    admin
      .from("evento_acceptance_responses")
      .select("term_id, accepted")
      .eq("tenant_id", tenantId)
      .eq("evento_id", eventoId),
    admin.from("tenant_financial_settings").select("*").eq("tenant_id", tenantId).maybeSingle(),
    admin
      .from("evento_contracts")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("evento_id", eventoId),
    admin
      .from("evento_contracts")
      .select("id, status, contract_number, contract_html, contract_hash")
      .eq("tenant_id", tenantId)
      .eq("evento_id", eventoId)
      .eq("status", "generated")
      .maybeSingle(),
    admin.from("tenant_company_profiles").select("*").eq("tenant_id", tenantId).maybeSingle(),
    admin
      .from("tenant_contract_module_settings")
      .select("template_params")
      .eq("tenant_id", tenantId)
      .maybeSingle(),
  ]);

  if (eventoResult.error) throw eventoResult.error;
  if (!eventoResult.data) throw new Error("Evento não encontrado.");

  const resolvedTemplate = await loadTenantContractTemplateForGeneration(admin, tenantId, {
    packageId: eventoResult.data.pacote_id as number | null,
  });

  const acceptedContract = await admin
    .from("evento_contracts")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("evento_id", eventoId)
    .eq("status", "accepted")
    .maybeSingle();

  if (acceptedContract.error) throw acceptedContract.error;
  if (acceptedContract.data) {
    throw new Error("Já existe um contrato aceito para esta festa.");
  }

  if (pendingGeneratedResult.error) throw pendingGeneratedResult.error;
  if (pendingGeneratedResult.data) {
    const { error: cancelError } = await admin
      .from("evento_contracts")
      .update({
        assinatura_followup_status: "cancelado",
        status: "cancelled",
      })
      .eq("tenant_id", tenantId)
      .eq("id", pendingGeneratedResult.data.id);

    if (cancelError) throw cancelError;
  }

  let packageRow: Record<string, unknown> | null = null;
  if (eventoResult.data.pacote_id) {
    const { data: packageData, error: packageError } = await admin
      .from("tenant_packages")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("id", eventoResult.data.pacote_id)
      .maybeSingle();

    if (packageError) throw packageError;
    packageRow = packageData;
  }

  const closingResponses: Record<string, string> = {};
  (closingResponsesResult.data ?? []).forEach((row) => {
    closingResponses[String(row.field_id)] = row.value ?? "";
  });

  const acceptanceResponses: Record<string, boolean> = {};
  (acceptanceResponsesResult.data ?? []).forEach((row) => {
    acceptanceResponses[String(row.term_id)] = row.accepted;
  });

  const sequence = (existingContractsResult.count ?? 0) + 1;
  const contractNumber = buildContractNumber(tenantId, eventoId, sequence);

  const built = await buildEventoContract({
    acceptanceResponses,
    acceptanceTerms: (acceptanceTermsResult.data ?? []).map((row) => ({
      active: row.active,
      appearsInContract: row.appears_in_contract,
      content: row.content,
      id: row.id,
      showInForm: row.show_in_form ?? true,
      termKey: row.term_key ?? null,
      title: row.title,
    })),
    closingFields: (closingFieldsResult.data ?? []).map((row) => ({
      fieldKey: row.field_key,
      id: row.id,
      label: row.label,
    })),
    closingResponses,
    companyProfile: companyProfileResult.data,
    contractNumber,
    evento: eventoResult.data,
    financialSettings: financialResult.data,
    packageRow,
    templateHtml: resolvedTemplate.templateHtml,
    templateKey: resolvedTemplate.templateKey,
    templateParams: parseTenantContractTemplateParams(moduleSettingsResult.data?.template_params),
  });

  const { data: inserted, error: insertError } = await admin
    .from("evento_contracts")
    .insert({
      assinatura_followup_status: "ativo",
      contract_hash: built.contractHash,
      contract_html: built.contractHtml,
      contract_number: contractNumber,
      contract_snapshot: built.contractSnapshot,
      contract_text: built.contractText,
      evento_id: eventoId,
      generated_at: new Date().toISOString(),
      status: "generated",
      template_id: resolvedTemplate.id,
      template_version: resolvedTemplate.version,
      tenant_id: tenantId,
    })
    .select("id, contract_number, contract_html, contract_hash, status")
    .single();

  if (insertError) throw insertError;
  return inserted;
};

const handleLoad = async (admin: ReturnType<typeof createClient>, tenantSlug: string) => {
  const tenant = await resolveTenant(admin, tenantSlug);
  if (!tenant) {
    return jsonResponse({ error: "Espaço não encontrado." }, 404);
  }

  const [fieldsResult, termsResult, packagesResult, additionalsResult, paymentMethodsResult, financialResult, moduleSettingsResult] =
    await Promise.all([
      admin
        .from("tenant_closing_form_fields")
        .select(
          "id, section, label, field_key, field_type, required, active, sort_order, is_system, description, config, category, package_ids",
        )
        .eq("tenant_id", tenant.id)
        .eq("active", true)
        .order("section", { ascending: true })
        .order("sort_order", { ascending: true }),
      admin
        .from("tenant_acceptance_terms")
        .select(
          "id, title, content, is_required, active, sort_order, appears_in_contract, show_in_form, show_at_signing, term_key",
        )
        .eq("tenant_id", tenant.id)
        .eq("active", true)
        .eq("show_in_form", true)
        .order("sort_order", { ascending: true }),
      admin
        .from("tenant_packages")
        .select(
          "id, name, name_automacao, description, active, included_guests, pricing_tiers, included_items, excluded_items, buffet, equipe, estrutura, duration_minutes, rules, sort_order",
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
        .select("id, name, payment_type, active, allowed_for_deposit, allowed_for_remaining_balance, sort_order")
        .eq("tenant_id", tenant.id)
        .eq("active", true)
        .order("sort_order", { ascending: true }),
      admin
        .from("tenant_financial_settings")
        .select("*")
        .eq("tenant_id", tenant.id)
        .maybeSingle(),
      admin
        .from("tenant_contract_module_settings")
        .select("template_params")
        .eq("tenant_id", tenant.id)
        .maybeSingle(),
    ]);

  if (fieldsResult.error) throw fieldsResult.error;
  if (termsResult.error) throw termsResult.error;
  if (packagesResult.error) throw packagesResult.error;
  if (additionalsResult.error) throw additionalsResult.error;
  if (paymentMethodsResult.error) throw paymentMethodsResult.error;
  if (financialResult.error) throw financialResult.error;
  if (moduleSettingsResult.error) throw moduleSettingsResult.error;

  const templateParams = parseTenantContractTemplateParams(
    moduleSettingsResult.data?.template_params,
  );

  const signingTermsResult = await admin
    .from("tenant_acceptance_terms")
    .select(
      "id, title, content, is_required, active, sort_order, appears_in_contract, show_in_form, show_at_signing",
    )
    .eq("tenant_id", tenant.id)
    .eq("active", true)
    .eq("show_at_signing", true)
    .order("sort_order", { ascending: true });

  if (signingTermsResult.error) throw signingTermsResult.error;

  return jsonResponse({
    acceptanceTerms: (termsResult.data ?? []).map(mapPublicTerm),
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
      packageIds: (field.package_ids ?? []).map(String),
      required: field.required,
      section: field.section,
      sortOrder: field.sort_order,
    })),
    financialSettings: financialResult.data,
    maxVenueGuestCapacity: templateParams.capacidade_maxima_espaco,
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
      nameAutomacao: pkg.name_automacao,
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
      type: method.payment_type,
    })),
    signingTerms: (signingTermsResult.data ?? []).map(mapPublicTerm),
    tenantName: tenant.name,
    tenantSlug: tenant.slug,
  });
};

const buildEventoUpdatesFromSubmit = (payload: z.infer<typeof submitSchema>) => {
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

  if (eventoUpdates.valor_total !== undefined) {
    eventoUpdates.valor_saldo = computeClosingFormValorSaldo(
      Number(eventoUpdates.valor_total || 0),
      entradaValue,
    );
  }

  if (payload.pacoteId != null) {
    eventoUpdates.pacote_id = payload.pacoteId;
  }

  if (payload.adicionaisSnapshot != null) {
    eventoUpdates.adicionais_snapshot = payload.adicionaisSnapshot;

    const adicionaisField = payload.fields.find((field) => field.fieldKey === "adicionais_selecionados");
    if (adicionaisField && Array.isArray(payload.adicionaisSnapshot)) {
      const labels = payload.adicionaisSnapshot
        .flatMap((item) => {
          if (!item || typeof item !== "object") return [];
          const row = item as Record<string, unknown>;
          return typeof row.name === "string" && row.name.trim() ? [row.name.trim()] : [];
        })
        .join(", ");

      if (labels) {
        const fieldId = Number(adicionaisField.id);
        const existing = customResponses.find((response) => response.field_id === fieldId);
        if (existing) {
          if (!existing.value.trim()) existing.value = labels;
        } else {
          customResponses.push({ field_id: fieldId, value: labels });
        }
      }
    }
  }

  return { customResponses, eventoUpdates };
};

const subtractDaysFromDateString = (dateValue: string, days: number): string | null => {
  const date = new Date(`${dateValue}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
};

const applyBalancePaymentSchedule = (
  eventoUpdates: Record<string, unknown>,
  schedule: "7_dias_antes" | "mensal" | null | undefined,
  financialSettings: { max_installments?: number | null } | null,
) => {
  if (!schedule) return;

  if (schedule === "7_dias_antes") {
    const eventDate = typeof eventoUpdates.data_evento === "string" ? eventoUpdates.data_evento : null;
    const dueDate = eventDate ? subtractDaysFromDateString(eventDate, 7) : null;
    if (dueDate) eventoUpdates.data_limite_pagamento = dueDate;
    eventoUpdates.parcelas = 1;
    eventoUpdates.forma_pagamento_saldo = "7 dias antes da festa";
    return;
  }

  eventoUpdates.parcelas = financialSettings?.max_installments ?? 3;
  eventoUpdates.forma_pagamento_saldo = "Mensal";
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

  const normalizedPhone = normalizeBrazilMobilePhoneForStorage(phoneValue);
  const phoneValidationError = getBrazilMobilePhoneValidationError(phoneValue);
  if (!normalizedPhone || phoneValidationError) {
    return jsonResponse(
      {
        error:
          phoneValidationError ??
          "Informe o celular completo com DDD e 9 dígitos (ex: (45) 99978-5617).",
      },
      400,
    );
  }

  const nameField = payload.fields.find((field) => field.fieldKey === "cliente_nome");
  const emailField = payload.fields.find((field) => field.fieldKey === "cliente_email");
  const clientName = nameField ? (payload.fieldValues[nameField.id] ?? "").trim() : null;
  const clientEmail = emailField ? (payload.fieldValues[emailField.id] ?? "").trim() : null;

  const funnelEventos = await loadFunnelLeadCandidates(admin, tenant.id, {
    clientName,
    linkedEventoId: payload.linkedEventoId ?? null,
    normalizedPhone,
  });

  const leadMatchCriteria = {
    email: clientEmail || null,
    linkedEventoId: payload.linkedEventoId ?? null,
    name: clientName || null,
    phone: normalizedPhone,
  };

  const leadMatch = resolveFunnelLeadMatch(funnelEventos, leadMatchCriteria);
  const { customResponses, eventoUpdates } = buildEventoUpdatesFromSubmit(payload);
  eventoUpdates.cliente_telefone = normalizedPhone;

  const { data: financialSettings } = await admin
    .from("tenant_financial_settings")
    .select("max_installments")
    .eq("tenant_id", tenant.id)
    .maybeSingle();

  applyBalancePaymentSchedule(eventoUpdates, payload.balancePaymentSchedule, financialSettings);
  const now = new Date().toISOString();
  const pendingContractStage = resolveFunnelStagePendingContractSignature();

  let targetEventoId: number;
  let updatedEvento: {
    cliente_cpf: string | null;
    cliente_email: string | null;
    cliente_nome: string;
    cliente_telefone: string | null;
    etapa: string;
    funil: string;
    id: number;
  };

  if (leadMatch) {
    const { data, error: updateError } = await admin
      .from("eventos")
      .update({
        ...eventoUpdates,
        ...pendingContractStage,
      })
      .eq("id", leadMatch.evento.id)
      .eq("tenant_id", tenant.id)
      .select("id, funil, etapa, cliente_nome, cliente_cpf, cliente_email, cliente_telefone")
      .single();

    if (updateError) throw updateError;

    targetEventoId = leadMatch.evento.id;
    updatedEvento = data;
  } else {
    const clienteNome =
      typeof eventoUpdates.cliente_nome === "string" && eventoUpdates.cliente_nome.trim()
        ? eventoUpdates.cliente_nome.trim()
        : "Cliente formulário público";

    const { data, error: insertError } = await admin
      .from("eventos")
      .insert({
        ...eventoUpdates,
        ...pendingContractStage,
        cliente_nome: clienteNome,
        origem: "formulario_publico",
        tenant_id: tenant.id,
        tipo_evento: "festa",
      })
      .select("id, funil, etapa, cliente_nome, cliente_cpf, cliente_email, cliente_telefone")
      .single();

    if (insertError) throw insertError;

    targetEventoId = data.id;
    updatedEvento = data;
  }

  if (customResponses.length > 0) {
    const { error: responsesError } = await admin.from("evento_closing_responses").upsert(
      customResponses.map((response) => ({
        evento_id: targetEventoId,
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
        accepted: response.accepted,
        accepted_at: now,
        evento_id: targetEventoId,
        tenant_id: tenant.id,
        term_id: response.termId,
      })),
      { onConflict: "evento_id,term_id" },
    );

    if (acceptanceError) throw acceptanceError;
  }

  const contract = await generateEventoContractForPublicFlow(admin, tenant.id, targetEventoId);

  const { data: signingTerms, error: signingTermsError } = await admin
    .from("tenant_acceptance_terms")
    .select("id, title, content, is_required, active, sort_order, appears_in_contract, show_in_form, show_at_signing")
    .eq("tenant_id", tenant.id)
    .eq("active", true)
    .eq("show_at_signing", true)
    .order("sort_order", { ascending: true });

  if (signingTermsError) throw signingTermsError;

  return jsonResponse({
    clientName: updatedEvento.cliente_nome,
    clientCpf: updatedEvento.cliente_cpf,
    clientEmail: updatedEvento.cliente_email,
    clientPhone: updatedEvento.cliente_telefone,
    contractHash: contract.contract_hash,
    contractHtml: contract.contract_html,
    contractId: contract.id,
    contractNumber: contract.contract_number,
    eventoId: updatedEvento.id,
    message: leadMatch
      ? "Formulário recebido. Leia o contrato abaixo e confirme sua assinatura para concluir a contratação."
      : "Cadastro criado. Leia o contrato abaixo e confirme sua assinatura.",
    signingTerms: (signingTerms ?? []).map(mapPublicTerm),
  });
};

const handleAcceptContract = async (
  admin: ReturnType<typeof createClient>,
  payload: z.infer<typeof acceptContractSchema>,
  request: Request,
) => {
  const tenant = await resolveTenant(admin, payload.tenantSlug);
  if (!tenant) {
    return jsonResponse({ error: "Espaço não encontrado." }, 404);
  }

  const { data: evento, error: eventoError } = await admin
    .from("eventos")
    .select("id, funil, etapa, cliente_nome, cliente_email, cliente_telefone")
    .eq("tenant_id", tenant.id)
    .eq("id", payload.eventoId)
    .maybeSingle();

  if (eventoError) throw eventoError;
  if (!evento) return jsonResponse({ error: "Evento não encontrado." }, 404);

  if (!phonesMatch(evento.cliente_telefone, payload.clientPhone)) {
    return jsonResponse({ error: "Telefone não confere com o cadastro desta contratação." }, 403);
  }

  const { data: contract, error: contractError } = await admin
    .from("evento_contracts")
    .select("*")
    .eq("tenant_id", tenant.id)
    .eq("id", payload.contractId)
    .eq("evento_id", payload.eventoId)
    .maybeSingle();

  if (contractError) throw contractError;
  if (!contract) return jsonResponse({ error: "Contrato não encontrado." }, 404);
  if (contract.status !== "generated") {
    return jsonResponse({ error: "Este contrato já foi assinado ou não está disponível." }, 400);
  }

  const { data: signingTerms, error: termsError } = await admin
    .from("tenant_acceptance_terms")
    .select("id, title, content, is_required, active, show_at_signing")
    .eq("tenant_id", tenant.id)
    .eq("active", true)
    .eq("show_at_signing", true);

  if (termsError) throw termsError;

  const acceptedTermsSnapshot = (signingTerms ?? []).map((term) => {
    const response = payload.termAcceptances.find((item) => item.termId === term.id);
    return {
      accepted: response?.accepted ?? false,
      content: term.content,
      termId: term.id,
      title: term.title,
    };
  });

  const requiredMissing = (signingTerms ?? []).filter(
    (term) => term.is_required && !acceptedTermsSnapshot.find((item) => item.termId === term.id)?.accepted,
  );

  if (requiredMissing.length > 0) {
    return jsonResponse({ error: "Aceite todos os termos obrigatórios antes de assinar o contrato." }, 400);
  }

  const acceptedAt = new Date().toISOString();
  const userAgent = request.headers.get("user-agent");
  const ipAddress = resolveClientIp(request);

  const { error: acceptanceError } = await admin.from("evento_contract_acceptances").insert({
    accepted_at: acceptedAt,
    accepted_by_cpf: payload.acceptedByCpf?.trim() || null,
    accepted_by_email: payload.acceptedByEmail?.trim() || null,
    accepted_by_name: payload.acceptedByName.trim(),
    accepted_by_phone: payload.acceptedByPhone?.trim() || null,
    accepted_terms_snapshot: acceptedTermsSnapshot,
    acceptance_text: payload.acceptanceText?.trim() || CONTRACT_ACCEPTANCE_DECLARATION,
    contract_id: payload.contractId,
    evento_id: payload.eventoId,
    ip_address: ipAddress,
    metadata: {
      contract_hash: contract.contract_hash,
      source: "public_form",
    },
    tenant_id: tenant.id,
    user_agent: userAgent,
  });

  if (acceptanceError) throw acceptanceError;

  const { error: updateContractError } = await admin
    .from("evento_contracts")
    .update({
      accepted_at: acceptedAt,
      assinatura_followup_status: "cancelado",
      status: "accepted",
    })
    .eq("tenant_id", tenant.id)
    .eq("id", payload.contractId);

  if (updateContractError) throw updateContractError;

  const funnelMigration = resolveFunnelStageAfterContractAcceptance(evento.funil);
  const isAlreadyInBoasVindas = evento.funil === "festa" && evento.etapa === "boas_vindas";
  const eventoUpdates: Record<string, unknown> = {};

  if (funnelMigration) {
    eventoUpdates.funil = funnelMigration.funil;
    eventoUpdates.etapa = funnelMigration.etapa;
    eventoUpdates.status_interno = funnelMigration.status_interno;
    eventoUpdates.tipo_evento = "festa";
    eventoUpdates.fechamento_confirmado_em = acceptedAt;
    eventoUpdates.boas_vindas_whatsapp_agendado_em = acceptedAt;
    eventoUpdates.motivo_perda = null;
  } else if (isAlreadyInBoasVindas) {
    eventoUpdates.fechamento_confirmado_em = acceptedAt;
    eventoUpdates.boas_vindas_whatsapp_agendado_em = acceptedAt;
  }

  if (Object.keys(eventoUpdates).length > 0) {
    const { data: updatedEvento, error: updateEventoError } = await admin
      .from("eventos")
      .update(eventoUpdates)
      .eq("tenant_id", tenant.id)
      .eq("id", payload.eventoId)
      .select("id, funil, etapa")
      .single();

    if (updateEventoError) throw updateEventoError;

    if (funnelMigration) {
      const funnelEventos = await loadFunnelLeadCandidates(admin, tenant.id, {
        clientName: evento.cliente_nome,
        linkedEventoId: payload.eventoId,
        normalizedPhone: evento.cliente_telefone ?? "",
      });

      await archiveDuplicateVendasLeads(admin, tenant.id, payload.eventoId, funnelEventos, {
        email: evento.cliente_email,
        name: evento.cliente_nome,
        phone: evento.cliente_telefone,
      });
    }

    const advancedToFesta =
      updatedEvento.funil === "festa" && updatedEvento.etapa === "boas_vindas";

    let whatsappDispatch: Awaited<ReturnType<typeof dispatchBoasVindasAfterContractSigned>> | null =
      null;

    if (advancedToFesta || isAlreadyInBoasVindas) {
      try {
        whatsappDispatch = await dispatchBoasVindasAfterContractSigned(admin, {
          acceptedAt,
          contractId: payload.contractId,
          contractNumber: contract.contract_number,
          eventoId: payload.eventoId,
          tenant: {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
          },
        });
      } catch (dispatchError) {
        console.error("boas-vindas dispatch error", dispatchError);
        whatsappDispatch = {
          dispatched: false,
          errorMessage:
            dispatchError instanceof Error ? dispatchError.message : "Erro ao disparar Boas Vindas.",
          responseStatus: null,
          skippedReason: null,
        };
      }
    }

    return jsonResponse({
      acceptedAt,
      advancedToFesta,
      etapa: updatedEvento.etapa,
      funil: updatedEvento.funil,
      message: "Contrato assinado com sucesso! Em breve entraremos em contato.",
      whatsappDispatch,
      whatsappDispatchScheduled: advancedToFesta || isAlreadyInBoasVindas,
    });
  }

  return jsonResponse({
    acceptedAt,
    advancedToFesta: false,
    message: "Contrato assinado com sucesso!",
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

    if (parsed.data.action === "accept_contract") {
      return await handleAcceptContract(admin, parsed.data, request);
    }

    return await handleSubmit(admin, parsed.data);
  } catch (error) {
    console.error("client-contract-form error", error);
    return jsonResponse(
      { error: resolveRuntimeErrorMessage(error) },
      500,
    );
  }
});
