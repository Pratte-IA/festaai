import { persistAgentOutboundAutomationMessage } from "./agent-memory.ts";
import { resolveAutomationConnectionId } from "./automation-bindings.ts";
import { formatCompanyDisplayName } from "./company-display-name.ts";
import { sendEvolutionTextMessage } from "./evolution-send-text.ts";
import { resolveWhatsAppPhoneForOutbound } from "./phone.ts";
import {
  PESQUISA_SATISFACAO_TEMPLATE_KEY,
  SATISFACTION_SURVEY_FOLLOWUP_EVENT,
} from "./satisfaction-survey-followup-constants.ts";
import {
  buildSatisfactionSurveyFollowupMessage,
  buildSatisfactionSurveyFollowupNota,
  SATISFACTION_SURVEY_FOLLOWUP_MESSAGE_TEMPLATE_KEY,
} from "./satisfaction-survey-followup-message.ts";
import { buildPublicSatisfactionSurveyUrl } from "./satisfaction-survey-dispatch-message.ts";

type ServiceClient = {
  from: (table: string) => Record<string, unknown>;
};

export interface DispatchSatisfactionSurveyFollowupInput {
  eventoId: number;
  tenant: {
    id: number;
    name: string;
    slug: string;
  };
  triggeredAt: string;
}

export interface DispatchSatisfactionSurveyFollowupResult {
  dispatched: boolean;
  errorMessage: string | null;
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

export const dispatchSatisfactionSurveyFollowup = async (
  admin: ServiceClient,
  input: DispatchSatisfactionSurveyFollowupInput,
): Promise<DispatchSatisfactionSurveyFollowupResult> => {
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
    PESQUISA_SATISFACAO_TEMPLATE_KEY,
  );

  if (connectionId == null) {
    return {
      dispatched: false,
      errorMessage: null,
      responseStatus: null,
      skippedReason: "WhatsApp da Pesquisa de Satisfação não vinculado nas automações.",
    };
  }

  const { data: evento, error: eventoError } = await admin
    .from("eventos")
    .select(
      "id, aniversariante_nome, cliente_nome, cliente_telefone, etapa, funil, satisfaction_survey_whatsapp_enviado_em, satisfaction_survey_preenchido_em, satisfaction_survey_followup_enviado_em",
    )
    .eq("tenant_id", input.tenant.id)
    .eq("id", input.eventoId)
    .maybeSingle();

  if (eventoError) throw eventoError;
  if (!evento) {
    return {
      dispatched: false,
      errorMessage: "Evento não encontrado para lembrete da pesquisa.",
      responseStatus: null,
      skippedReason: null,
    };
  }

  if (evento.funil !== "executadas" || evento.etapa !== "aguardando_feedback") {
    return {
      dispatched: false,
      errorMessage: null,
      responseStatus: null,
      skippedReason: "Evento não está mais aguardando feedback da pesquisa.",
    };
  }

  if (!evento.satisfaction_survey_whatsapp_enviado_em) {
    return {
      dispatched: false,
      errorMessage: null,
      responseStatus: null,
      skippedReason: "Pesquisa ainda não foi enviada para este evento.",
    };
  }

  if (evento.satisfaction_survey_preenchido_em) {
    return {
      dispatched: false,
      errorMessage: null,
      responseStatus: null,
      skippedReason: "Cliente já respondeu a pesquisa.",
    };
  }

  if (evento.satisfaction_survey_followup_enviado_em) {
    return {
      dispatched: false,
      errorMessage: null,
      responseStatus: null,
      skippedReason: "Lembrete da pesquisa já enviado para este evento.",
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
      skippedReason: "Cliente sem celular válido para envio do lembrete.",
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
      errorMessage: "Conexão WhatsApp vinculada à pesquisa não encontrada.",
      responseStatus: null,
      skippedReason: null,
    };
  }

  if (connection.status !== "connected") {
    return {
      dispatched: false,
      errorMessage: null,
      responseStatus: null,
      skippedReason: "Conexão WhatsApp da pesquisa ainda não está ativa.",
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

  const companyLegalName = await resolveCompanyLegalName(admin, input.tenant.id, input.tenant.name);
  const templateBody = await loadTenantTemplateBody(
    admin,
    input.tenant.id,
    SATISFACTION_SURVEY_FOLLOWUP_MESSAGE_TEMPLATE_KEY,
  );
  const appUrl = (Deno.env.get("APP_URL") ?? "https://festaai.com.br").replace(/\/$/, "");
  const surveyUrl = buildPublicSatisfactionSurveyUrl(appUrl, input.tenant.slug, input.eventoId);

  const messageText = buildSatisfactionSurveyFollowupMessage({
    aniversarianteNome:
      typeof evento.aniversariante_nome === "string" ? evento.aniversariante_nome : null,
    clienteNome: typeof evento.cliente_nome === "string" ? evento.cliente_nome : null,
    companyLegalName,
    surveyUrl,
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
    event: SATISFACTION_SURVEY_FOLLOWUP_EVENT,
    instance_name: instanceName,
    message_id: sendResult.messageId,
    n8n_response_status: sendResult.status,
    n8n_status: sendResult.ok ? "sent" : "failed",
    payload: {
      companyDisplayName: formatCompanyDisplayName(companyLegalName),
      event: SATISFACTION_SURVEY_FOLLOWUP_EVENT,
      evento: { id: evento.id },
      surveyUrl,
      templateKey: PESQUISA_SATISFACAO_TEMPLATE_KEY,
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
        etapa: "redes_sociais",
        funil: "executadas",
        satisfaction_survey_followup_enviado_em: input.triggeredAt,
      })
      .eq("tenant_id", input.tenant.id)
      .eq("id", input.eventoId)
      .eq("etapa", "aguardando_feedback")
      .is("satisfaction_survey_followup_enviado_em", null)
      .is("satisfaction_survey_preenchido_em", null);

    await admin.from("evento_notas").insert({
      evento_id: input.eventoId,
      tenant_id: input.tenant.id,
      texto: buildSatisfactionSurveyFollowupNota({
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
        source: "satisfaction_survey_followup_automation",
        templateKey: SATISFACTION_SURVEY_FOLLOWUP_MESSAGE_TEMPLATE_KEY,
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
