import {
  buildEventoFinanceiroValores,
  type EventoFinanceiroValores,
} from "./event-financial.ts";
import { forwardToN8n, N8N_PAYLOAD_VERSION } from "./n8n-client.ts";
import { isTenantSystemArmed, SYSTEM_NOT_ARMED_SKIP_REASON } from "./system-armed.ts";

const BOAS_VINDAS_TEMPLATE_KEY = "boas-vindas";
const BOAS_VINDAS_EVENT = "boas_vindas.contract_signed";

type ServiceClient = {
  from: (table: string) => Record<string, unknown>;
};

interface AutomationBinding {
  connectionId: number | null;
  key: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseAutomationBindings = (raw: unknown): AutomationBinding[] => {
  if (!Array.isArray(raw)) return [];

  const bindings: AutomationBinding[] = [];

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

const resolveOutboundWebhookUrl = (settings: Record<string, unknown> | null): string | null => {
  const raw = settings?.n8n_outbound_webhook_urls;
  if (!isRecord(raw)) return null;

  const url = raw[BOAS_VINDAS_TEMPLATE_KEY];
  return typeof url === "string" && url.trim().length > 0 ? url.trim() : null;
};

const resolveBoasVindasConnectionId = (settings: Record<string, unknown> | null): number | null => {
  const bindings = parseAutomationBindings(settings?.automation_template_bindings);
  return bindings.find((binding) => binding.key === BOAS_VINDAS_TEMPLATE_KEY)?.connectionId ?? null;
};

export interface DispatchBoasVindasInput {
  acceptedAt: string;
  contractId: number;
  contractNumber: string | null;
  eventoId: number;
  tenant: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface DispatchBoasVindasResult {
  dispatched: boolean;
  errorMessage: string | null;
  responseStatus: number | null;
  skippedReason: string | null;
}

const buildLogPayload = (payload: Record<string, unknown>) => ({
  event: payload.event,
  evento: {
    id: (payload.evento as Record<string, unknown> | undefined)?.id ?? null,
    pacoteNameAutomacao:
      ((payload.evento as Record<string, unknown> | undefined)?.pacote as Record<string, unknown> | undefined)
        ?.nameAutomacao ?? null,
  },
  tenant: payload.tenant,
  version: payload.version,
});

export const dispatchBoasVindasAfterContractSigned = async (
  admin: ServiceClient,
  input: DispatchBoasVindasInput,
): Promise<DispatchBoasVindasResult> => {
  const { data: settings, error: settingsError } = await admin
    .from("tenant_automation_settings")
    .select("automation_template_bindings, n8n_outbound_webhook_urls, system_armed")
    .eq("tenant_id", input.tenant.id)
    .maybeSingle();

  if (settingsError) {
    return {
      dispatched: false,
      errorMessage: settingsError instanceof Error ? settingsError.message : "Erro ao carregar automações.",
      responseStatus: null,
      skippedReason: null,
    };
  }

  if (!isTenantSystemArmed(settings)) {
    return {
      dispatched: false,
      errorMessage: null,
      responseStatus: null,
      skippedReason: SYSTEM_NOT_ARMED_SKIP_REASON,
    };
  }

  const webhookUrl = resolveOutboundWebhookUrl(settings);
  if (!webhookUrl) {
    return {
      dispatched: false,
      errorMessage: null,
      responseStatus: null,
      skippedReason: "Webhook de Boas Vindas não configurado para este tenant.",
    };
  }

  const connectionId = resolveBoasVindasConnectionId(settings);

  const { data: evento, error: eventoError } = await admin
    .from("eventos")
    .select("*")
    .eq("tenant_id", input.tenant.id)
    .eq("id", input.eventoId)
    .maybeSingle();

  if (eventoError) throw eventoError;
  if (!evento) {
    return {
      dispatched: false,
      errorMessage: "Evento não encontrado para disparo de Boas Vindas.",
      responseStatus: null,
      skippedReason: null,
    };
  }

  let connection: Record<string, unknown> | null = null;
  if (connectionId != null) {
    const { data: connectionRow, error: connectionError } = await admin
      .from("whatsapp_connections")
      .select("id, instance_name, name, phone, status")
      .eq("tenant_id", input.tenant.id)
      .eq("id", connectionId)
      .maybeSingle();

    if (connectionError) throw connectionError;
    connection = connectionRow;
  }

  let pacote: Record<string, unknown> | null = null;
  if (evento.pacote_id != null) {
    const { data: pacoteRow, error: pacoteError } = await admin
      .from("tenant_packages")
      .select(
        "id, name, name_automacao, buffet, included_items, excluded_items, included_guests, duration_minutes, equipe, estrutura, rules",
      )
      .eq("tenant_id", input.tenant.id)
      .eq("id", evento.pacote_id)
      .maybeSingle();

    if (pacoteError) throw pacoteError;
    pacote = pacoteRow;
  }

  const { data: closingResponses, error: responsesError } = await admin
    .from("evento_closing_responses")
    .select("field_id, value, tenant_closing_form_fields(label, field_key, field_type)")
    .eq("tenant_id", input.tenant.id)
    .eq("evento_id", input.eventoId);

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

  // Recalcula os valores financeiros em tempo real, espelhando a UI (EventoDetalhe):
  // - pagamentos adicionais vêm de evento_pagamentos
  // - ajustes de recebível (upsell/desconto) vêm de financeiro_lancamentos
  const { data: pagamentos, error: pagamentosError } = await admin
    .from("evento_pagamentos")
    .select("valor")
    .eq("tenant_id", input.tenant.id)
    .eq("evento_id", input.eventoId);

  if (pagamentosError) throw pagamentosError;

  const { data: lancamentos, error: lancamentosError } = await admin
    .from("financeiro_lancamentos")
    .select("tipo, categoria, origem, valor")
    .eq("tenant_id", input.tenant.id)
    .eq("evento_id", input.eventoId);

  if (lancamentosError) throw lancamentosError;

  const financeiro: EventoFinanceiroValores = buildEventoFinanceiroValores(
    evento,
    pagamentos ?? [],
    lancamentos ?? [],
  );

  const payload = {
    connection: connection
      ? {
          id: connection.id,
          instanceName: connection.instance_name,
          name: connection.name,
          phone: connection.phone,
          status: connection.status,
        }
      : null,
    contract: {
      acceptedAt: input.acceptedAt,
      contractNumber: input.contractNumber,
      id: input.contractId,
    },
    dados: {
      dataFesta: evento.data_evento,
      horarioFesta: evento.hora_evento,
      nomeAniversariante: evento.aniversariante_nome,
      nomeCliente: evento.cliente_nome,
      pacote: pacote?.name ?? evento.pacote_nome,
      pacoteAutomacao: pacote?.name_automacao ?? null,
      quantidadeConvidados: evento.quantidade_convidados,
      // Valores recalculados em tempo real (pagamentos + ajustes). A coluna
      // eventos.valor_saldo pode estar desatualizada e não deve alimentar a mensagem.
      saldoAPagar: financeiro.saldoAPagar,
      tema: evento.aniversariante_tema ?? null,
      valorPago: financeiro.valorPago,
      valorTotal: financeiro.valorTotal,
    },
    event: BOAS_VINDAS_EVENT,
    evento: {
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
      clienteTelefone: evento.cliente_telefone,
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
      // Saldo recalculado em tempo real; a coluna eventos.valor_saldo pode estar desatualizada.
      valorSaldo: financeiro.saldoAPagar,
      valorTotal: evento.valor_total,
    },
    source: "festaai",
    templateKey: BOAS_VINDAS_TEMPLATE_KEY,
    tenant: {
      id: input.tenant.id,
      name: input.tenant.name,
      slug: input.tenant.slug,
    },
    trigger: {
      at: input.acceptedAt,
      type: "contract_acceptance",
    },
    version: N8N_PAYLOAD_VERSION,
  };

  const forwardResult = await forwardToN8n(payload, webhookUrl);

  const logPayload = buildLogPayload(payload as Record<string, unknown>);

  await admin.from("automation_dispatch_logs").insert({
    connection_id: connectionId,
    customer_phone: typeof evento.cliente_telefone === "string" ? evento.cliente_telefone : null,
    direction: "outbound_to_n8n",
    error_message: forwardResult.errorMessage,
    event: BOAS_VINDAS_EVENT,
    instance_name: typeof connection?.instance_name === "string" ? connection.instance_name : null,
    message_id: null,
    n8n_response_status: forwardResult.responseStatus,
    n8n_status: forwardResult.ok ? "sent" : "failed",
    payload: logPayload,
    tenant_id: input.tenant.id,
  });

  if (forwardResult.ok) {
    await admin
      .from("eventos")
      .update({
        boas_vindas_whatsapp_agendado_em: null,
        boas_vindas_whatsapp_enviado_em: input.acceptedAt,
      })
      .eq("tenant_id", input.tenant.id)
      .eq("id", input.eventoId);
  }

  return {
    dispatched: forwardResult.ok,
    errorMessage: forwardResult.errorMessage,
    responseStatus: forwardResult.responseStatus,
    skippedReason: null,
  };
};
