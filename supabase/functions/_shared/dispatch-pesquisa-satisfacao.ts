import { formatCompanyDisplayName } from "./company-display-name.ts";
import { sendEvolutionTextMessage } from "./evolution-send-text.ts";
import { resolveWhatsAppPhoneForOutbound } from "./phone.ts";
import {
  buildPublicSatisfactionSurveyUrl,
  buildSatisfactionSurveyDispatchMessage,
} from "./satisfaction-survey-dispatch-message.ts";
import { isTenantSystemArmed, SYSTEM_NOT_ARMED_SKIP_REASON } from "./system-armed.ts";

const PESQUISA_SATISFACAO_TEMPLATE_KEY = "pesquisa-satisfacao";
const PESQUISA_SATISFACAO_EVENT = "pesquisa_satisfacao.post_party";

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

const resolvePesquisaSatisfacaoConnectionId = (
  settings: Record<string, unknown> | null,
): number | null => {
  const bindings = parseAutomationBindings(settings?.automation_template_bindings);
  return (
    bindings.find((binding) => binding.key === PESQUISA_SATISFACAO_TEMPLATE_KEY)?.connectionId ??
    null
  );
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

export interface DispatchPesquisaSatisfacaoInput {
  eventoId: number;
  tenant: {
    id: number;
    name: string;
    slug: string;
  };
  triggeredAt: string;
}

export interface DispatchPesquisaSatisfacaoResult {
  dispatched: boolean;
  errorMessage: string | null;
  responseStatus: number | null;
  skippedReason: string | null;
}

export const dispatchPesquisaSatisfacaoAfterPostParty = async (
  admin: ServiceClient,
  input: DispatchPesquisaSatisfacaoInput,
): Promise<DispatchPesquisaSatisfacaoResult> => {
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

  const connectionId = resolvePesquisaSatisfacaoConnectionId(settings);
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
      "id, aniversariante_nome, cliente_nome, cliente_telefone, data_evento, etapa, funil, satisfaction_survey_whatsapp_enviado_em",
    )
    .eq("tenant_id", input.tenant.id)
    .eq("id", input.eventoId)
    .maybeSingle();

  if (eventoError) throw eventoError;
  if (!evento) {
    return {
      dispatched: false,
      errorMessage: "Evento não encontrado para disparo da Pesquisa de Satisfação.",
      responseStatus: null,
      skippedReason: null,
    };
  }

  if (evento.satisfaction_survey_whatsapp_enviado_em) {
    return {
      dispatched: false,
      errorMessage: null,
      responseStatus: null,
      skippedReason: "Pesquisa de Satisfação já enviada para este evento.",
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
      skippedReason: "Cliente sem celular válido para envio da pesquisa.",
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

  const companyLegalName = await resolveCompanyLegalName(
    admin,
    input.tenant.id,
    input.tenant.name,
  );
  const appUrl = (Deno.env.get("APP_URL") ?? "https://festaai.com.br").replace(/\/$/, "");
  const surveyUrl = buildPublicSatisfactionSurveyUrl(appUrl, input.tenant.slug, input.eventoId);
  const messageText = buildSatisfactionSurveyDispatchMessage({
    aniversarianteNome:
      typeof evento.aniversariante_nome === "string" ? evento.aniversariante_nome : null,
    clienteNome: typeof evento.cliente_nome === "string" ? evento.cliente_nome : null,
    companyLegalName,
    surveyUrl,
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
    event: PESQUISA_SATISFACAO_EVENT,
    instance_name: instanceName,
    message_id: sendResult.messageId,
    n8n_response_status: sendResult.status,
    n8n_status: sendResult.ok ? "sent" : "failed",
    payload: {
      companyDisplayName: formatCompanyDisplayName(companyLegalName),
      event: PESQUISA_SATISFACAO_EVENT,
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
        satisfaction_survey_whatsapp_enviado_em: input.triggeredAt,
      })
      .eq("tenant_id", input.tenant.id)
      .eq("id", input.eventoId)
      .is("satisfaction_survey_whatsapp_enviado_em", null);
  }

  return {
    dispatched: sendResult.ok,
    errorMessage: sendResult.errorMessage,
    responseStatus: sendResult.status,
    skippedReason: null,
  };
};
