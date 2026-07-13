import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

import {
  buildEventoFinanceiroValores,
  type EventoFinanceiroValores,
} from "../_shared/event-financial.ts";
import { forwardToN8n, N8N_PAYLOAD_VERSION } from "../_shared/n8n-client.ts";

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

const SETE_DIAS_TEMPLATE_KEY = "sete-dias-antes";
const BOAS_VINDAS_TEMPLATE_KEY = "boas-vindas";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseAutomationBindings = (raw: unknown) => {
  if (!Array.isArray(raw)) return [] as Array<{ connectionId: number | null; key: string }>;

  const bindings: Array<{ connectionId: number | null; key: string }> = [];
  for (const entry of raw) {
    if (!isRecord(entry)) continue;
    const key = typeof entry.key === "string" ? entry.key.trim() : "";
    if (!key) continue;
    const connectionId =
      typeof entry.connectionId === "number" && Number.isFinite(entry.connectionId)
        ? entry.connectionId
        : null;
    bindings.push({ connectionId, key });
  }
  return bindings;
};

const resolveOutboundWebhookUrl = (
  settings: Record<string, unknown> | null,
  templateKey: string,
) => {
  const raw = settings?.n8n_outbound_webhook_urls;
  if (!isRecord(raw)) return null;
  const url = raw[templateKey];
  return typeof url === "string" && url.trim().length > 0 ? url.trim() : null;
};

const buildDadosPayload = (
  evento: Record<string, unknown>,
  pacote: Record<string, unknown> | null,
  financeiro: EventoFinanceiroValores,
) => ({
  dataFesta: evento.data_evento,
  horarioFesta: evento.hora_evento,
  nomeAniversariante: evento.aniversariante_nome,
  nomeCliente: evento.cliente_nome,
  pacote: pacote?.name ?? evento.pacote_nome,
  pacoteAutomacao: pacote?.name_automacao ?? null,
  quantidadeConvidados: evento.quantidade_convidados,
  saldoAPagar: financeiro.saldoAPagar,
  tema: evento.aniversariante_tema ?? null,
  valorPago: financeiro.valorPago,
  valorTotal: financeiro.valorTotal,
});

const buildEventoPayload = (
  evento: Record<string, unknown>,
  pacote: Record<string, unknown> | null,
  customFields: Array<Record<string, unknown>>,
  financeiro: EventoFinanceiroValores,
  testPhone: string,
) => ({
  adicionaisSnapshot: evento.adicionais_snapshot,
  aniversarianteDataNascimento: evento.aniversariante_data_nascimento,
  aniversarianteIdade: evento.aniversariante_idade,
  aniversarianteNome: evento.aniversariante_nome,
  aniversariantePersonagem: evento.aniversariante_personagem,
  aniversarianteTema: evento.aniversariante_tema,
  clienteBairro: evento.cliente_bairro,
  clienteCep: evento.cliente_cep,
  clienteCidade: evento.cliente_cidade,
  clienteCpf: evento.cliente_cpf,
  clienteEmail: evento.cliente_email,
  clienteEstado: evento.cliente_estado,
  clienteNome: evento.cliente_nome,
  clienteNumero: evento.cliente_numero,
  clienteRua: evento.cliente_rua,
  clienteTelefone: testPhone,
  customFields,
  dataEvento: evento.data_evento,
  dataLimitePagamento: evento.data_limite_pagamento,
  etapa: evento.etapa,
  formaPagamentoEntrada: evento.forma_pagamento_entrada,
  formaPagamentoSaldo: evento.forma_pagamento_saldo,
  funil: evento.funil,
  horaEvento: evento.hora_evento,
  horaTermino: evento.hora_termino,
  id: evento.id,
  observacoes: evento.observacoes,
  pacote: pacote
    ? {
        buffet: pacote.buffet,
        durationMinutes: pacote.duration_minutes,
        equipe: pacote.equipe,
        estrutura: pacote.estrutura,
        excludedItems: pacote.excluded_items,
        id: pacote.id,
        includedGuests: pacote.included_guests,
        includedItems: pacote.included_items,
        name: pacote.name,
        nameAutomacao: pacote.name_automacao,
        rules: pacote.rules,
      }
    : {
        buffet: null,
        name: evento.pacote_nome,
        nameAutomacao: null,
      },
  pacoteConvidadosInclusos: evento.pacote_convidados_inclusos,
  pacoteId: evento.pacote_id,
  pacoteNome: evento.pacote_nome,
  parcelas: evento.parcelas,
  quantidadeAdultos: evento.quantidade_adultos,
  quantidadeConvidados: evento.quantidade_convidados,
  quantidadeCriancas: evento.quantidade_criancas,
  valorAdicionais: evento.valor_adicionais,
  valorEntrada: evento.valor_entrada,
  valorPacote: evento.valor_pacote,
  valorSaldo: financeiro.saldoAPagar,
  valorTotal: evento.valor_total,
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const cronSecret = Deno.env.get("DISPATCH_AUTOMATION_TEST_CRON_SECRET") ?? "";
    if (cronSecret) {
      const received = req.headers.get("x-cron-secret");
      if (received !== cronSecret) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }
    }

    const body = await req.json().catch(() => ({}));
    const eventoId = Number(body.eventoId ?? 693);
    const tenantId = Number(body.tenantId ?? 2);
    const testPhone = typeof body.testPhone === "string" ? body.testPhone.trim() : "5545999785617";
    const workflows = Array.isArray(body.workflows)
      ? body.workflows.filter((entry: unknown) => typeof entry === "string")
      : ["sete-dias-antes", "boas-vindas"];

    if (!Number.isFinite(eventoId) || eventoId <= 0) {
      return jsonResponse({ error: "eventoId inválido." }, 400);
    }

    const supabase = createClient(requiredEnv("SUPABASE_URL"), requiredEnv("SUPABASE_SERVICE_ROLE_KEY"));

    const { data: evento, error: eventoError } = await supabase
      .from("eventos")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("id", eventoId)
      .maybeSingle();

    if (eventoError) throw eventoError;
    if (!evento) return jsonResponse({ error: "Evento não encontrado." }, 404);

    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id, name, slug")
      .eq("id", tenantId)
      .maybeSingle();

    if (tenantError) throw tenantError;
    if (!tenant) return jsonResponse({ error: "Tenant não encontrado." }, 404);

    const { data: settings, error: settingsError } = await supabase
      .from("tenant_automation_settings")
      .select("automation_template_bindings, n8n_outbound_webhook_urls")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (settingsError) throw settingsError;

    let pacote: Record<string, unknown> | null = null;
    if (evento.pacote_id != null) {
      const { data: pacoteRow, error: pacoteError } = await supabase
        .from("tenant_packages")
        .select(
          "id, name, name_automacao, buffet, included_items, excluded_items, included_guests, duration_minutes, equipe, estrutura, rules",
        )
        .eq("tenant_id", tenantId)
        .eq("id", evento.pacote_id)
        .maybeSingle();
      if (pacoteError) throw pacoteError;
      pacote = pacoteRow;
    }

    const { data: closingResponses, error: responsesError } = await supabase
      .from("evento_closing_responses")
      .select("field_id, value, tenant_closing_form_fields(label, field_key, field_type)")
      .eq("tenant_id", tenantId)
      .eq("evento_id", eventoId);
    if (responsesError) throw responsesError;

    const customFields = (closingResponses ?? []).map((row: Record<string, unknown>) => {
      const fieldMeta = row.tenant_closing_form_fields as Record<string, unknown> | null;
      return {
        fieldId: row.field_id,
        fieldKey: typeof fieldMeta?.field_key === "string" ? fieldMeta.field_key : null,
        fieldType: typeof fieldMeta?.field_type === "string" ? fieldMeta.field_type : null,
        label: typeof fieldMeta?.label === "string" ? fieldMeta.label : null,
        value: row.value,
      };
    });

    const { data: pagamentos, error: pagamentosError } = await supabase
      .from("evento_pagamentos")
      .select("valor")
      .eq("tenant_id", tenantId)
      .eq("evento_id", eventoId);
    if (pagamentosError) throw pagamentosError;

    const { data: lancamentos, error: lancamentosError } = await supabase
      .from("financeiro_lancamentos")
      .select("tipo, categoria, origem, valor")
      .eq("tenant_id", tenantId)
      .eq("evento_id", eventoId);
    if (lancamentosError) throw lancamentosError;

    const financeiro = buildEventoFinanceiroValores(evento, pagamentos ?? [], lancamentos ?? []);
    const now = new Date().toISOString();
    const bindings = parseAutomationBindings(settings?.automation_template_bindings);

    const loadConnection = async (templateKey: string) => {
      const connectionId = bindings.find((entry) => entry.key === templateKey)?.connectionId ?? null;
      if (connectionId == null) return null;

      const { data: connection, error } = await supabase
        .from("whatsapp_connections")
        .select("id, instance_name, name, phone, status")
        .eq("tenant_id", tenantId)
        .eq("id", connectionId)
        .maybeSingle();

      if (error) throw error;
      if (!connection) return null;

      return {
        id: connection.id,
        instanceName: connection.instance_name,
        name: connection.name,
        phone: connection.phone,
        status: connection.status,
      };
    };

    const eventoPayload = buildEventoPayload(evento, pacote, customFields, financeiro, testPhone);
    const dados = buildDadosPayload(evento, pacote, financeiro);
    const results: Array<Record<string, unknown>> = [];

    if (workflows.includes("sete-dias-antes")) {
      const webhookUrl = resolveOutboundWebhookUrl(settings, SETE_DIAS_TEMPLATE_KEY);
      if (!webhookUrl) {
        results.push({ workflow: SETE_DIAS_TEMPLATE_KEY, ok: false, error: "Webhook não configurado." });
      } else {
        const connection = await loadConnection(SETE_DIAS_TEMPLATE_KEY);
        const payload = {
          connection,
          dados,
          event: "sete_dias_antes.party_reminder",
          evento: eventoPayload,
          source: "festaai",
          templateKey: SETE_DIAS_TEMPLATE_KEY,
          tenant,
          trigger: { at: now, type: "seven_days_before_party", test: true, phoneOverride: testPhone },
          version: N8N_PAYLOAD_VERSION,
        };
        const forwardResult = await forwardToN8n(payload, webhookUrl);
        results.push({
          workflow: SETE_DIAS_TEMPLATE_KEY,
          dados,
          financeiro,
          ok: forwardResult.ok,
          responseStatus: forwardResult.responseStatus,
          errorMessage: forwardResult.errorMessage,
        });
      }
    }

    if (workflows.includes("boas-vindas")) {
      const webhookUrl = resolveOutboundWebhookUrl(settings, BOAS_VINDAS_TEMPLATE_KEY);
      if (!webhookUrl) {
        results.push({ workflow: BOAS_VINDAS_TEMPLATE_KEY, ok: false, error: "Webhook não configurado." });
      } else {
        const connection = await loadConnection(BOAS_VINDAS_TEMPLATE_KEY);
        const payload = {
          connection,
          contract: {
            acceptedAt: now,
            contractNumber: `TEST-${eventoId}`,
            id: 0,
          },
          dados,
          event: "boas_vindas.contract_signed",
          evento: eventoPayload,
          source: "festaai",
          templateKey: BOAS_VINDAS_TEMPLATE_KEY,
          tenant,
          trigger: { at: now, type: "contract_acceptance", test: true, phoneOverride: testPhone },
          version: N8N_PAYLOAD_VERSION,
        };
        const forwardResult = await forwardToN8n(payload, webhookUrl);
        results.push({
          workflow: BOAS_VINDAS_TEMPLATE_KEY,
          dados,
          financeiro,
          ok: forwardResult.ok,
          responseStatus: forwardResult.responseStatus,
          errorMessage: forwardResult.errorMessage,
        });
      }
    }

    return jsonResponse({
      eventoId,
      financeiro,
      originalPhone: evento.cliente_telefone,
      results,
      testPhone,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado.";
    console.error("[dispatch-automation-test]", message);
    return jsonResponse({ error: message }, 500);
  }
});
