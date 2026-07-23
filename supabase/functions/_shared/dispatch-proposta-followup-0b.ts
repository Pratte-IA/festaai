import { persistAgentOutboundAutomationMessage } from "./agent-memory.ts";
import { resolveAutomationConnectionId } from "./automation-bindings.ts";
import { formatCompanyDisplayName } from "./company-display-name.ts";
import { resolveContatoInicialAwaitingReplySince } from "./contato-inicial-followup.ts";
import { sendEvolutionTextMessage } from "./evolution-send-text.ts";
import { resolveWhatsAppPhoneForOutbound } from "./phone.ts";
import {
  buildPropostaFollowup0bMessage,
  buildPropostaFollowup0bNota,
} from "./proposta-followup-0b-message.ts";
import {
  PROPOSTA_FOLLOWUP_0B_EVENT,
  PROPOSTA_FOLLOWUP_0B_LOSS_MOTIVO,
  PROPOSTA_FOLLOWUP_0B_TEMPLATE_ENCERRAMENTO,
  PROPOSTA_FOLLOWUP_TEMPLATE_KEY,
} from "./proposta-followup-constants.ts";
import { isTenantSystemArmed, SYSTEM_NOT_ARMED_SKIP_REASON } from "./system-armed.ts";

type ServiceClient = {
  from: (table: string) => Record<string, unknown>;
};

export interface DispatchPropostaFollowup0bInput {
  eventoId: number;
  tenant: {
    id: number;
    name: string;
    slug: string;
  };
  triggeredAt: string;
}

export interface DispatchPropostaFollowup0bResult {
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

export const dispatchPropostaFollowup0b = async (
  admin: ServiceClient,
  input: DispatchPropostaFollowup0bInput,
): Promise<DispatchPropostaFollowup0bResult> => {
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
      movedToPerdido: false,
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
      movedToPerdido: false,
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
      "id, cliente_nome, cliente_telefone, etapa, followup_0_enviado_em, followup_0b_enviado_em, funil, status_interno",
    )
    .eq("tenant_id", input.tenant.id)
    .eq("id", input.eventoId)
    .maybeSingle();

  if (eventoError) throw eventoError;
  if (!evento) {
    return {
      dispatched: false,
      errorMessage: "Evento não encontrado para follow-up 0b.",
      movedToPerdido: false,
      responseStatus: null,
      skippedReason: null,
    };
  }

  if (!evento.followup_0_enviado_em) {
    return {
      dispatched: false,
      errorMessage: null,
      movedToPerdido: false,
      responseStatus: null,
      skippedReason: "Follow-up 0 ainda não enviado para este evento.",
    };
  }

  if (evento.followup_0b_enviado_em) {
    return {
      dispatched: false,
      errorMessage: null,
      movedToPerdido: false,
      responseStatus: null,
      skippedReason: "Follow-up 0b já enviado para este evento.",
    };
  }

  if (evento.etapa !== "contato_inicial" || evento.funil !== "vendas") {
    return {
      dispatched: false,
      errorMessage: null,
      movedToPerdido: false,
      responseStatus: null,
      skippedReason: "Lead não está mais em Contato Inicial.",
    };
  }

  const statusInterno =
    typeof evento.status_interno === "string" ? evento.status_interno : null;
  if (statusInterno === "perdido" || statusInterno === "cancelado") {
    return {
      dispatched: false,
      errorMessage: null,
      movedToPerdido: false,
      responseStatus: null,
      skippedReason: "Lead inativo (perdido/cancelado).",
    };
  }

  // Se o cliente respondeu após o FU0 (última mensagem no histórico é humana),
  // não envia o FU0b nem move para perdido.
  const awaitingSince = await resolveContatoInicialAwaitingReplySince(admin, {
    customerPhone: typeof evento.cliente_telefone === "string" ? evento.cliente_telefone : null,
    tenantId: input.tenant.id,
  });
  if (!awaitingSince) {
    return {
      dispatched: false,
      errorMessage: null,
      movedToPerdido: false,
      responseStatus: null,
      skippedReason: "Cliente já respondeu após o FU0 — 2ª tentativa cancelada.",
    };
  }

  const customerPhone = resolveWhatsAppPhoneForOutbound(
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
    PROPOSTA_FOLLOWUP_0B_TEMPLATE_ENCERRAMENTO,
  );
  const companyLegalName = await resolveCompanyLegalName(admin, input.tenant.id, input.tenant.name);

  const messageText = buildPropostaFollowup0bMessage({
    clienteNome: typeof evento.cliente_nome === "string" ? evento.cliente_nome : null,
    companyLegalName,
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
    event: PROPOSTA_FOLLOWUP_0B_EVENT,
    instance_name: instanceName,
    message_id: sendResult.messageId,
    n8n_response_status: sendResult.status,
    n8n_status: sendResult.ok ? "sent" : "failed",
    payload: {
      companyDisplayName: formatCompanyDisplayName(companyLegalName),
      event: PROPOSTA_FOLLOWUP_0B_EVENT,
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
        followup_0b_enviado_em: input.triggeredAt,
        followup_status: "concluido_perdido",
        motivo_perda: PROPOSTA_FOLLOWUP_0B_LOSS_MOTIVO,
        status_interno: "perdido",
      })
      .eq("tenant_id", input.tenant.id)
      .eq("id", input.eventoId)
      .is("followup_0b_enviado_em", null);

    await admin.from("evento_notas").insert({
      evento_id: input.eventoId,
      tenant_id: input.tenant.id,
      texto: buildPropostaFollowup0bNota({
        enviadoEm: input.triggeredAt,
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
        followupStep: "0b",
        movedToPerdido: true,
        source: "followup_automation",
        templateKey: PROPOSTA_FOLLOWUP_0B_TEMPLATE_ENCERRAMENTO,
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
