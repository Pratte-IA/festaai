import { persistAgentOutboundAutomationMessage } from "./agent-memory.ts";
import { resolveAutomationConnectionId } from "./automation-bindings.ts";
import { formatCompanyDisplayName } from "./company-display-name.ts";
import { isEventDateAvailableForTenant } from "./event-date-availability.ts";
import { sendEvolutionTextMessage } from "./evolution-send-text.ts";
import {
  buildPerdidoFuturoFup1Message,
  buildPerdidoFuturoFup1Nota,
} from "./perdido-futuro-message.ts";
import {
  PERDIDO_FUTURO_FUP1_EVENT,
  type PerdidoFuturoFup1Variante,
  perdidoFuturoFup1VarianteToTemplateKey,
} from "./perdido-futuro-constants.ts";
import { PERDIDO_REATIVACAO_TEMPLATE_KEY } from "./perdido-reativacao-constants.ts";
import { resolveWhatsAppPhoneForOutbound } from "./phone.ts";
import { isTenantSystemArmed, SYSTEM_NOT_ARMED_SKIP_REASON } from "./system-armed.ts";

type ServiceClient = {
  from: (table: string) => Record<string, unknown>;
};

export interface DispatchPerdidoFuturoFup1Input {
  eventoId: number;
  tenant: {
    id: number;
    name: string;
    slug: string;
  };
  triggeredAt: string;
}

export interface DispatchPerdidoFuturoFup1Result {
  dispatched: boolean;
  errorMessage: string | null;
  responseStatus: number | null;
  skippedReason: string | null;
  variante: PerdidoFuturoFup1Variante | null;
}

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

export const dispatchPerdidoFuturoFup1 = async (
  admin: ServiceClient,
  input: DispatchPerdidoFuturoFup1Input,
): Promise<DispatchPerdidoFuturoFup1Result> => {
  const { data: settings, error: settingsError } = await admin
    .from("tenant_automation_settings")
    .select("automation_template_bindings, system_armed")
    .eq("tenant_id", input.tenant.id)
    .maybeSingle();

  if (settingsError) {
    return {
      dispatched: false,
      errorMessage:
        settingsError instanceof Error ? settingsError.message : "Erro ao carregar automações.",
      responseStatus: null,
      skippedReason: null,
      variante: null,
    };
  }

  if (!isTenantSystemArmed(settings)) {
    return {
      dispatched: false,
      errorMessage: null,
      responseStatus: null,
      skippedReason: SYSTEM_NOT_ARMED_SKIP_REASON,
      variante: null,
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
      skippedReason: "WhatsApp de Follow-up de Oportunidade não vinculado nas automações.",
      variante: null,
    };
  }

  const { data: evento, error: eventoError } = await admin
    .from("eventos")
    .select(
      "id, aniversariante_nome, cliente_nome, cliente_telefone, data_evento, etapa, fup1_enviado_em, funil",
    )
    .eq("tenant_id", input.tenant.id)
    .eq("id", input.eventoId)
    .maybeSingle();

  if (eventoError) throw eventoError;
  if (!evento) {
    return {
      dispatched: false,
      errorMessage: "Evento não encontrado para FUP1.",
      responseStatus: null,
      skippedReason: null,
      variante: null,
    };
  }

  if (evento.fup1_enviado_em) {
    return {
      dispatched: false,
      errorMessage: null,
      responseStatus: null,
      skippedReason: "Follow-up FUP1 já enviado para este evento.",
      variante: null,
    };
  }

  if (evento.etapa !== "perdido" || evento.funil !== "vendas") {
    return {
      dispatched: false,
      errorMessage: null,
      responseStatus: null,
      skippedReason: "Lead não está mais em Perdido.",
      variante: null,
    };
  }

  const dataEvento = typeof evento.data_evento === "string" ? evento.data_evento : null;
  if (!dataEvento) {
    return {
      dispatched: false,
      errorMessage: null,
      responseStatus: null,
      skippedReason: "Lead sem data da festa — follow-up não enviado.",
      variante: null,
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
      variante: null,
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
      variante: null,
    };
  }

  if (connection.status !== "connected") {
    return {
      dispatched: false,
      errorMessage: null,
      responseStatus: null,
      skippedReason: "Conexão WhatsApp do follow-up ainda não está ativa.",
      variante: null,
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
      variante: null,
    };
  }

  const { data: secretRow, error: secretError } = await admin
    .from("whatsapp_connection_webhook_secrets")
    .select("instance_api_key")
    .eq("connection_id", connectionId)
    .maybeSingle();

  if (secretError) throw secretError;

  const dateAvailable = await isEventDateAvailableForTenant(admin, input.tenant.id, dataEvento);
  const variante: PerdidoFuturoFup1Variante = dateAvailable ? "data_livre" : "data_indisponivel";
  const templateKey = perdidoFuturoFup1VarianteToTemplateKey(variante);
  const templateBody = await loadTenantTemplateBody(admin, input.tenant.id, templateKey);
  const companyLegalName = await resolveCompanyLegalName(admin, input.tenant.id, input.tenant.name);

  const messageText = buildPerdidoFuturoFup1Message({
    aniversarianteNome:
      typeof evento.aniversariante_nome === "string" ? evento.aniversariante_nome : null,
    clienteNome: typeof evento.cliente_nome === "string" ? evento.cliente_nome : null,
    companyLegalName,
    dataEvento,
    templateBody,
    variante,
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
    event: PERDIDO_FUTURO_FUP1_EVENT,
    instance_name: instanceName,
    message_id: sendResult.messageId,
    n8n_response_status: sendResult.status,
    n8n_status: sendResult.ok ? "sent" : "failed",
    payload: {
      companyDisplayName: formatCompanyDisplayName(companyLegalName),
      event: PERDIDO_FUTURO_FUP1_EVENT,
      evento: { id: evento.id, variante },
      templateKey: PERDIDO_REATIVACAO_TEMPLATE_KEY,
      tenant: {
        id: input.tenant.id,
        slug: input.tenant.slug,
      },
    },
    tenant_id: input.tenant.id,
  });

  if (sendResult.ok) {
    await admin
      .from("eventos")
      .update({
        fup1_enviado_em: input.triggeredAt,
        fup1_variante: variante,
      })
      .eq("tenant_id", input.tenant.id)
      .eq("id", input.eventoId)
      .is("fup1_enviado_em", null);

    await admin.from("evento_notas").insert({
      evento_id: input.eventoId,
      tenant_id: input.tenant.id,
      texto: buildPerdidoFuturoFup1Nota({
        dataEvento,
        enviadoEm: input.triggeredAt,
        variante,
      }),
    });

    await persistAgentOutboundAutomationMessage(admin, {
      connectionId,
      content: messageText,
      customerPhone,
      messageId: sendResult.messageId,
      metadata: {
        dataEvento,
        direction: "outbound",
        eventoId: input.eventoId,
        followupStep: "fup1",
        source: "perdido_futuro_automation",
        templateKey,
        variante,
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
    variante,
  };
};
