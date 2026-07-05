import { persistAgentOutboundAutomationMessage } from "./agent-memory.ts";
import { resolveAutomationConnectionId } from "./automation-bindings.ts";
import { formatCompanyDisplayName } from "./company-display-name.ts";
import { sendEvolutionTextMessage } from "./evolution-send-text.ts";
import { normalizeBrazilMobilePhoneForStorage } from "./phone.ts";
import {
  buildPropostaFollowup4Message,
  buildPropostaFollowup4Nota,
} from "./proposta-followup-4-message.ts";
import {
  PROPOSTA_FOLLOWUP_4_EVENT,
  PROPOSTA_FOLLOWUP_4_TEMPLATE_ENCERRAMENTO,
  PROPOSTA_FOLLOWUP_LOSS_MOTIVO,
  PROPOSTA_FOLLOWUP_TEMPLATE_KEY,
} from "./proposta-followup-constants.ts";

type ServiceClient = {
  from: (table: string) => Record<string, unknown>;
};

export interface DispatchPropostaFollowup4Input {
  eventoId: number;
  tenant: {
    id: number;
    name: string;
    slug: string;
  };
  triggeredAt: string;
}

export interface DispatchPropostaFollowup4Result {
  dispatched: boolean;
  errorMessage: string | null;
  movedToPerdido: boolean;
  responseStatus: number | null;
  skippedReason: string | null;
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

export const dispatchPropostaFollowup4 = async (
  admin: ServiceClient,
  input: DispatchPropostaFollowup4Input,
): Promise<DispatchPropostaFollowup4Result> => {
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
      movedToPerdido: false,
      responseStatus: null,
      skippedReason: null,
    };
  }

  const connectionId = resolveAutomationConnectionId(
    settings?.automation_template_bindings,
    PROPOSTA_FOLLOWUP_TEMPLATE_KEY,
  );

  if (connectionId == null) {
    return {
      dispatched: false,
      errorMessage: null,
      movedToPerdido: false,
      responseStatus: null,
      skippedReason: "WhatsApp de Follow-up de Proposta não vinculado nas automações.",
    };
  }

  const { data: evento, error: eventoError } = await admin
    .from("eventos")
    .select(
      "id, aniversariante_nome, cliente_nome, cliente_telefone, data_evento, etapa, followup_3_enviado_em, followup_4_enviado_em, followup_status, funil",
    )
    .eq("tenant_id", input.tenant.id)
    .eq("id", input.eventoId)
    .maybeSingle();

  if (eventoError) throw eventoError;
  if (!evento) {
    return {
      dispatched: false,
      errorMessage: "Evento não encontrado para follow-up 4.",
      movedToPerdido: false,
      responseStatus: null,
      skippedReason: null,
    };
  }

  if (!evento.followup_3_enviado_em) {
    return {
      dispatched: false,
      errorMessage: null,
      movedToPerdido: false,
      responseStatus: null,
      skippedReason: "Follow-up 3 ainda não enviado para este evento.",
    };
  }

  if (evento.followup_4_enviado_em) {
    return {
      dispatched: false,
      errorMessage: null,
      movedToPerdido: false,
      responseStatus: null,
      skippedReason: "Follow-up 4 já enviado para este evento.",
    };
  }

  if (evento.etapa !== "proposta_enviada" || evento.funil !== "vendas") {
    return {
      dispatched: false,
      errorMessage: null,
      movedToPerdido: false,
      responseStatus: null,
      skippedReason: "Lead não está mais em Proposta Enviada.",
    };
  }

  if (evento.followup_status !== "ativo") {
    return {
      dispatched: false,
      errorMessage: null,
      movedToPerdido: false,
      responseStatus: null,
      skippedReason: "Sequência de follow-up não está ativa para este lead.",
    };
  }

  const dataEvento = typeof evento.data_evento === "string" ? evento.data_evento : null;
  if (!dataEvento) {
    return {
      dispatched: false,
      errorMessage: null,
      movedToPerdido: false,
      responseStatus: null,
      skippedReason: "Lead sem data da festa — follow-up não enviado.",
    };
  }

  const customerPhone = normalizeBrazilMobilePhoneForStorage(
    typeof evento.cliente_telefone === "string" ? evento.cliente_telefone : null,
  );
  if (!customerPhone) {
    return {
      dispatched: false,
      errorMessage: null,
      movedToPerdido: false,
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
      movedToPerdido: false,
      responseStatus: null,
      skippedReason: null,
    };
  }

  if (connection.status !== "connected") {
    return {
      dispatched: false,
      errorMessage: null,
      movedToPerdido: false,
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
      movedToPerdido: false,
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

  const templateBody = await loadTenantTemplateBody(
    admin,
    input.tenant.id,
    PROPOSTA_FOLLOWUP_4_TEMPLATE_ENCERRAMENTO,
  );
  const companyLegalName = await resolveCompanyLegalName(admin, input.tenant.id, input.tenant.name);

  const messageText = buildPropostaFollowup4Message({
    aniversarianteNome:
      typeof evento.aniversariante_nome === "string" ? evento.aniversariante_nome : null,
    clienteNome: typeof evento.cliente_nome === "string" ? evento.cliente_nome : null,
    companyLegalName,
    dataEvento,
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
    event: PROPOSTA_FOLLOWUP_4_EVENT,
    instance_name: instanceName,
    message_id: sendResult.messageId,
    n8n_response_status: sendResult.status,
    n8n_status: sendResult.ok ? "sent" : "failed",
    payload: {
      companyDisplayName: formatCompanyDisplayName(companyLegalName),
      event: PROPOSTA_FOLLOWUP_4_EVENT,
      evento: { id: evento.id, movedToPerdido: sendResult.ok },
      templateKey: PROPOSTA_FOLLOWUP_TEMPLATE_KEY,
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
        etapa: "perdido",
        followup_4_enviado_em: input.triggeredAt,
        followup_status: "concluido_perdido",
        motivo_perda: PROPOSTA_FOLLOWUP_LOSS_MOTIVO,
        status_interno: "perdido",
      })
      .eq("tenant_id", input.tenant.id)
      .eq("id", input.eventoId)
      .is("followup_4_enviado_em", null);

    await admin.from("evento_notas").insert({
      evento_id: input.eventoId,
      tenant_id: input.tenant.id,
      texto: buildPropostaFollowup4Nota({
        dataEvento,
        enviadoEm: input.triggeredAt,
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
        followupStep: 4,
        movedToPerdido: true,
        source: "followup_automation",
        templateKey: PROPOSTA_FOLLOWUP_4_TEMPLATE_ENCERRAMENTO,
      },
      role: "ai",
      tenantId: input.tenant.id,
    });
  }

  return {
    dispatched: sendResult.ok,
    errorMessage: sendResult.errorMessage,
    movedToPerdido: sendResult.ok,
    responseStatus: sendResult.status,
    skippedReason: null,
  };
};
