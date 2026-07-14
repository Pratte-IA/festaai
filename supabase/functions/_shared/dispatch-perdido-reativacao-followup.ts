import { persistAgentOutboundAutomationMessage } from "./agent-memory.ts";
import { resolveAutomationConnectionId } from "./automation-bindings.ts";
import { formatCompanyDisplayName } from "./company-display-name.ts";
import { sendEvolutionTextMessage } from "./evolution-send-text.ts";
import {
  buildPerdidoReativacaoMessage,
  buildPerdidoReativacaoNota,
} from "./perdido-reativacao-message.ts";
import {
  PERDIDO_REATIVACAO_TEMPLATE_KEY,
  type PerdidoReativacaoFopStep,
  perdidoReativacaoFopStepToEvent,
  perdidoReativacaoFopStepToTemplateKey,
} from "./perdido-reativacao-constants.ts";
import { resolveWhatsAppPhoneForOutbound } from "./phone.ts";

type ServiceClient = {
  from: (table: string) => Record<string, unknown>;
};

export interface DispatchPerdidoReativacaoFollowupInput {
  eventoId: number;
  step: PerdidoReativacaoFopStep;
  tenant: {
    id: number;
    name: string;
    slug: string;
  };
  triggeredAt: string;
}

export interface DispatchPerdidoReativacaoFollowupResult {
  dispatched: boolean;
  errorMessage: string | null;
  responseStatus: number | null;
  skippedReason: string | null;
}

const fopColumnByStep: Record<PerdidoReativacaoFopStep, string> = {
  1: "fop1_enviado_em",
  2: "fop2_enviado_em",
  3: "fop3_enviado_em",
};

const resolveCompanyLegalName = async (
  admin: ServiceClient,
  tenantId: number,
  fallbackName: string,
): Promise<string> => {
  const { data, error } = await admin
    .from("tenant_company_profiles")
    .select("company_name")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) throw error;

  const companyName = typeof data?.company_name === "string" ? data.company_name.trim() : "";
  return companyName || fallbackName;
};

const loadTenantTemplateBody = async (
  admin: ServiceClient,
  tenantId: number,
  templateKey: string,
): Promise<string | null> => {
  const { data, error } = await admin
    .from("tenant_message_templates")
    .select("body")
    .eq("tenant_id", tenantId)
    .eq("key", templateKey)
    .maybeSingle();

  if (error) throw error;

  const body = typeof data?.body === "string" ? data.body.trim() : "";
  return body || null;
};

export const dispatchPerdidoReativacaoFollowup = async (
  admin: ServiceClient,
  input: DispatchPerdidoReativacaoFollowupInput,
): Promise<DispatchPerdidoReativacaoFollowupResult> => {
  const fopColumn = fopColumnByStep[input.step];
  const templateKey = perdidoReativacaoFopStepToTemplateKey(input.step);
  const eventName = perdidoReativacaoFopStepToEvent(input.step);

  const { data: settings, error: settingsError } = await admin
    .from("tenant_automation_settings")
    .select("automation_template_bindings")
    .eq("tenant_id", input.tenant.id)
    .maybeSingle();

  if (settingsError) {
    return {
      dispatched: false,
      errorMessage:
        settingsError instanceof Error ? settingsError.message : "Erro ao carregar automações.",
      responseStatus: null,
      skippedReason: null,
    };
  }

  const connectionId = resolveAutomationConnectionId(
    settings?.automation_template_bindings,
    PERDIDO_REATIVACAO_TEMPLATE_KEY,
  );

  if (connectionId == null) {
    return {
      dispatched: false,
      errorMessage: null,
      responseStatus: null,
      skippedReason: "WhatsApp de Follow-up de Reativação não vinculado nas automações.",
    };
  }

  const { data: evento, error: eventoError } = await admin
    .from("eventos")
    .select(
      "id, aniversariante_nome, cliente_nome, cliente_telefone, data_evento, etapa, funil, reativacao_festa_alvo, reativacao_status, fop1_enviado_em, fop2_enviado_em, fop3_enviado_em",
    )
    .eq("tenant_id", input.tenant.id)
    .eq("id", input.eventoId)
    .maybeSingle();

  if (eventoError) throw eventoError;
  if (!evento) {
    return {
      dispatched: false,
      errorMessage: `Evento não encontrado para FOP${input.step}.`,
      responseStatus: null,
      skippedReason: null,
    };
  }

  if (evento[fopColumn as keyof typeof evento]) {
    return {
      dispatched: false,
      errorMessage: null,
      responseStatus: null,
      skippedReason: `Follow-up FOP${input.step} já enviado para este evento.`,
    };
  }

  if (evento.etapa !== "perdido" || evento.funil !== "vendas") {
    return {
      dispatched: false,
      errorMessage: null,
      responseStatus: null,
      skippedReason: "Lead não está mais em Perdido.",
    };
  }

  if (evento.reativacao_status !== "ativo" && evento.reativacao_status !== null) {
    return {
      dispatched: false,
      errorMessage: null,
      responseStatus: null,
      skippedReason: "Sequência de reativação não está ativa para este lead.",
    };
  }

  if (input.step === 2 && !evento.fop1_enviado_em) {
    return {
      dispatched: false,
      errorMessage: null,
      responseStatus: null,
      skippedReason: "FOP1 ainda não enviado para este lead.",
    };
  }

  if (input.step === 3 && !evento.fop2_enviado_em) {
    return {
      dispatched: false,
      errorMessage: null,
      responseStatus: null,
      skippedReason: "FOP2 ainda não enviado para este lead.",
    };
  }

  const targetPartyDate =
    typeof evento.reativacao_festa_alvo === "string" ? evento.reativacao_festa_alvo : null;
  if (!targetPartyDate) {
    return {
      dispatched: false,
      errorMessage: null,
      responseStatus: null,
      skippedReason: "Lead sem data alvo de reativação.",
    };
  }

  const customerPhone = resolveWhatsAppPhoneForOutbound(
    typeof evento.cliente_telefone === "string" ? evento.cliente_telefone : null,
  );
  if (!customerPhone) {
    return {
      dispatched: false,
      errorMessage: null,
      responseStatus: null,
      skippedReason: "Cliente sem celular válido para envio do follow-up.",
    };
  }

  const { data: connection, error: connectionError } = await admin
    .from("whatsapp_connections")
    .select("id, instance_name, name, phone, status")
    .eq("tenant_id", input.tenant.id)
    .eq("id", connectionId)
    .maybeSingle();

  if (connectionError) throw connectionError;
  if (!connection) {
    return {
      dispatched: false,
      errorMessage: "Conexão WhatsApp vinculada ao follow-up não encontrada.",
      responseStatus: null,
      skippedReason: null,
    };
  }

  if (connection.status !== "connected") {
    return {
      dispatched: false,
      errorMessage: null,
      responseStatus: null,
      skippedReason: "Conexão WhatsApp do follow-up ainda não está ativa.",
    };
  }

  const instanceName =
    typeof connection.instance_name === "string" ? connection.instance_name.trim() : "";
  if (!instanceName) {
    return {
      dispatched: false,
      errorMessage: "Instância Evolution da conexão WhatsApp não configurada.",
      responseStatus: null,
      skippedReason: null,
    };
  }

  const { data: secretRow, error: secretError } = await admin
    .from("whatsapp_connection_webhook_secrets")
    .select("instance_api_key")
    .eq("connection_id", connectionId)
    .maybeSingle();

  if (secretError) throw secretError;

  const templateBody = await loadTenantTemplateBody(admin, input.tenant.id, templateKey);
  const companyLegalName = await resolveCompanyLegalName(admin, input.tenant.id, input.tenant.name);

  const messageText = buildPerdidoReativacaoMessage({
    aniversarianteNome:
      typeof evento.aniversariante_nome === "string" ? evento.aniversariante_nome : null,
    clienteNome: typeof evento.cliente_nome === "string" ? evento.cliente_nome : null,
    companyLegalName,
    step: input.step,
    targetPartyDate,
    templateBody,
  });

  const sendResult = await sendEvolutionTextMessage({
    instanceApiKey:
      typeof secretRow?.instance_api_key === "string" ? secretRow.instance_api_key : null,
    instanceName,
    number: customerPhone,
    text: messageText,
  });

  await admin.from("automation_dispatch_logs").insert({
    connection_id: connectionId,
    customer_phone: customerPhone,
    direction: "outbound_whatsapp",
    error_message: sendResult.errorMessage,
    event: eventName,
    instance_name: instanceName,
    message_id: sendResult.messageId,
    n8n_response_status: sendResult.status,
    n8n_status: sendResult.ok ? "sent" : "failed",
    payload: {
      companyDisplayName: formatCompanyDisplayName(companyLegalName),
      event: eventName,
      evento: { id: evento.id, step: input.step },
      templateKey: PERDIDO_REATIVACAO_TEMPLATE_KEY,
      tenant: {
        id: input.tenant.id,
        slug: input.tenant.slug,
      },
    },
    tenant_id: input.tenant.id,
  });

  if (sendResult.ok) {
    const updatePayload: Record<string, unknown> = {
      [fopColumn]: input.triggeredAt,
      reativacao_status: "ativo",
    };

    await admin
      .from("eventos")
      .update(updatePayload)
      .eq("tenant_id", input.tenant.id)
      .eq("id", input.eventoId)
      .is(fopColumn, null);

    await admin.from("evento_notas").insert({
      evento_id: input.eventoId,
      tenant_id: input.tenant.id,
      texto: buildPerdidoReativacaoNota({
        enviadoEm: input.triggeredAt,
        step: input.step,
        targetPartyDate,
      }),
    });

    await persistAgentOutboundAutomationMessage(admin, {
      connectionId,
      content: messageText,
      customerPhone,
      messageId: sendResult.messageId,
      metadata: {
        direction: "outbound",
        eventoId: input.eventoId,
        followupStep: input.step,
        source: "perdido_reativacao_automation",
        targetPartyDate,
        templateKey,
      },
      role: "ai",
      tenantId: input.tenant.id,
    });
  }

  return {
    dispatched: sendResult.ok,
    errorMessage: sendResult.errorMessage,
    responseStatus: sendResult.status,
    skippedReason: null,
  };
};
