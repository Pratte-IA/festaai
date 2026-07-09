import { persistAgentOutboundAutomationMessage } from "./agent-memory.ts";
import { resolveAutomationConnectionId } from "./automation-bindings.ts";
import { formatCompanyDisplayName } from "./company-display-name.ts";
import {
  buildPublicContractFormUrl,
  CONTRACT_SIGNATURE_FOLLOWUP_INICIAL_EVENT,
  CONTRACT_SIGNATURE_FOLLOWUP_INICIAL_TEMPLATE,
  CONTRACT_SIGNATURE_FOLLOWUP_LEMBRETE_EVENT,
  CONTRACT_SIGNATURE_FOLLOWUP_LEMBRETE_TEMPLATE,
  CONTRACT_SIGNATURE_FOLLOWUP_TEMPLATE_KEY,
} from "./contract-signature-followup-constants.ts";
import {
  buildContractSignatureFollowupMessage,
  buildContractSignatureFollowupNota,
} from "./contract-signature-followup-message.ts";
import { sendEvolutionTextMessage } from "./evolution-send-text.ts";
import { resolveWhatsAppPhoneForOutbound } from "./phone.ts";

type ServiceClient = {
  from: (table: string) => Record<string, unknown>;
};

export type ContractSignatureFollowupStep = "inicial" | "lembrete";

export interface DispatchContractSignatureFollowupInput {
  contractId: number;
  eventoId: number;
  step: ContractSignatureFollowupStep;
  tenant: {
    id: number;
    name: string;
    slug: string;
  };
  triggeredAt: string;
}

export interface DispatchContractSignatureFollowupResult {
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

const stepToTemplateKey = (step: ContractSignatureFollowupStep): string =>
  step === "inicial"
    ? CONTRACT_SIGNATURE_FOLLOWUP_INICIAL_TEMPLATE
    : CONTRACT_SIGNATURE_FOLLOWUP_LEMBRETE_TEMPLATE;

const stepToEvent = (step: ContractSignatureFollowupStep): string =>
  step === "inicial"
    ? CONTRACT_SIGNATURE_FOLLOWUP_INICIAL_EVENT
    : CONTRACT_SIGNATURE_FOLLOWUP_LEMBRETE_EVENT;

export const dispatchContractSignatureFollowup = async (
  admin: ServiceClient,
  input: DispatchContractSignatureFollowupInput,
): Promise<DispatchContractSignatureFollowupResult> => {
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
    CONTRACT_SIGNATURE_FOLLOWUP_TEMPLATE_KEY,
  );

  if (connectionId == null) {
    return {
      dispatched: false,
      errorMessage: null,
      responseStatus: null,
      skippedReason: "WhatsApp de Follow-up de Assinatura não vinculado nas automações.",
    };
  }

  const { data: contract, error: contractError } = await admin
    .from("evento_contracts")
    .select(
      "id, status, assinatura_followup_status, assinatura_followup_inicial_enviado_em, assinatura_followup_lembrete_count",
    )
    .eq("tenant_id", input.tenant.id)
    .eq("id", input.contractId)
    .eq("evento_id", input.eventoId)
    .maybeSingle();

  if (contractError) throw contractError;
  if (!contract) {
    return {
      dispatched: false,
      errorMessage: "Contrato não encontrado para follow-up de assinatura.",
      responseStatus: null,
      skippedReason: null,
    };
  }

  if (contract.status !== "generated") {
    return {
      dispatched: false,
      errorMessage: null,
      responseStatus: null,
      skippedReason: "Contrato não está mais aguardando assinatura.",
    };
  }

  if (contract.assinatura_followup_status !== "ativo") {
    return {
      dispatched: false,
      errorMessage: null,
      responseStatus: null,
      skippedReason: "Follow-up de assinatura não está ativo para este contrato.",
    };
  }

  if (input.step === "inicial" && contract.assinatura_followup_inicial_enviado_em) {
    return {
      dispatched: false,
      errorMessage: null,
      responseStatus: null,
      skippedReason: "Follow-up inicial de assinatura já enviado.",
    };
  }

  if (input.step === "lembrete" && !contract.assinatura_followup_inicial_enviado_em) {
    return {
      dispatched: false,
      errorMessage: null,
      responseStatus: null,
      skippedReason: "Follow-up inicial ainda não foi enviado.",
    };
  }

  const { data: evento, error: eventoError } = await admin
    .from("eventos")
    .select(
      "id, aniversariante_nome, cliente_nome, cliente_telefone, data_evento, etapa, funil, status_interno",
    )
    .eq("tenant_id", input.tenant.id)
    .eq("id", input.eventoId)
    .maybeSingle();

  if (eventoError) throw eventoError;
  if (!evento) {
    return {
      dispatched: false,
      errorMessage: "Evento não encontrado para follow-up de assinatura.",
      responseStatus: null,
      skippedReason: null,
    };
  }

  if (evento.funil !== "vendas" || evento.etapa !== "negociacao") {
    return {
      dispatched: false,
      errorMessage: null,
      responseStatus: null,
      skippedReason: "Evento não está mais aguardando assinatura do contrato.",
    };
  }

  const statusInterno =
    typeof evento.status_interno === "string" ? evento.status_interno : null;
  if (statusInterno === "perdido" || statusInterno === "cancelado") {
    return {
      dispatched: false,
      errorMessage: null,
      responseStatus: null,
      skippedReason: "Lead inativo (perdido/cancelado).",
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

  const templateKey = stepToTemplateKey(input.step);
  const templateBody = await loadTenantTemplateBody(admin, input.tenant.id, templateKey);
  const companyLegalName = await resolveCompanyLegalName(admin, input.tenant.id, input.tenant.name);
  const appUrl = (Deno.env.get("APP_URL") ?? "https://festaai.com.br").replace(/\/$/, "");
  const linkFormulario = buildPublicContractFormUrl(appUrl, input.tenant.slug, input.eventoId);

  const messageText = buildContractSignatureFollowupMessage({
    aniversarianteNome:
      typeof evento.aniversariante_nome === "string" ? evento.aniversariante_nome : null,
    clienteNome: typeof evento.cliente_nome === "string" ? evento.cliente_nome : null,
    companyLegalName,
    dataEvento: typeof evento.data_evento === "string" ? evento.data_evento : null,
    linkFormulario,
    templateBody,
    templateKey,
  });

  const sendResult = await sendEvolutionTextMessage({
    instanceApiKey:
      typeof secretRow?.instance_api_key === "string" ? secretRow.instance_api_key : null,
    instanceName,
    number: customerPhone,
    text: messageText,
  });

  const eventName = stepToEvent(input.step);

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
      contract: { id: input.contractId },
      event: eventName,
      evento: { id: evento.id },
      linkFormulario,
      step: input.step,
      templateKey: CONTRACT_SIGNATURE_FOLLOWUP_TEMPLATE_KEY,
      tenant: {
        id: input.tenant.id,
        slug: input.tenant.slug,
      },
    },
    tenant_id: input.tenant.id,
  });

  if (sendResult.ok) {
    if (input.step === "inicial") {
      await admin
        .from("evento_contracts")
        .update({
          assinatura_followup_inicial_enviado_em: input.triggeredAt,
          assinatura_followup_ultimo_enviado_em: input.triggeredAt,
        })
        .eq("tenant_id", input.tenant.id)
        .eq("id", input.contractId)
        .is("assinatura_followup_inicial_enviado_em", null);
    } else {
      const currentCount =
        typeof contract.assinatura_followup_lembrete_count === "number"
          ? contract.assinatura_followup_lembrete_count
          : 0;

      await admin
        .from("evento_contracts")
        .update({
          assinatura_followup_lembrete_count: currentCount + 1,
          assinatura_followup_ultimo_enviado_em: input.triggeredAt,
        })
        .eq("tenant_id", input.tenant.id)
        .eq("id", input.contractId);
    }

    await admin.from("evento_notas").insert({
      evento_id: input.eventoId,
      tenant_id: input.tenant.id,
      texto: buildContractSignatureFollowupNota({
        enviadoEm: input.triggeredAt,
        step: input.step,
      }),
    });

    await persistAgentOutboundAutomationMessage(admin, {
      connectionId,
      content: messageText,
      customerPhone,
      messageId: sendResult.messageId,
      metadata: {
        contractId: input.contractId,
        direction: "outbound",
        eventoId: input.eventoId,
        followupStep: input.step,
        source: "contract_signature_followup_automation",
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
