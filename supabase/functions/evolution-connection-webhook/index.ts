import { createServiceClient } from "../_shared/auth-tenant.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { extractConnectionPhone, fetchMessageMediaBase64, syncConnectionWebhook } from "../_shared/evolution-client.ts";
import { syncTenantN8nEvolutionAutomation } from "../_shared/evolution-n8n-sync.ts";
import {
  isConnectionUpdateEvent,
  isHumanInterventionMessage,
  isInboundCustomerReplyMessage,
  isMediaMessageType,
  isMessagesUpsertEvent,
  parseEvolutionMessages,
  shouldSkipMessage,
} from "../_shared/evolution-message.ts";
import { isKnownAutomationOutboundMessage } from "../_shared/is-known-automation-outbound.ts";
import { ensureVendasLeadFromWhatsapp } from "../_shared/ensure-vendas-lead.ts";
import { ensureVilaEncantadaInboundRouting, isVilaEncantadaProductionInstance } from "../_shared/ensure-vila-encantada-inbound-routing.ts";
import { persistAgentConversationMessage } from "../_shared/agent-memory.ts";
import { pausePropostaFollowupOnCustomerReply } from "../_shared/pause-proposta-followup.ts";
import { resolveAutomationConnectionId } from "../_shared/automation-bindings.ts";
import { buildLogPayload, buildN8nInboundPayload, forwardToN8n } from "../_shared/n8n-client.ts";
import { phonesMatch } from "../_shared/phone.ts";

const ATENDIMENTO_TEMPLATE_KEY = "atendimento";

type AuthStatus = "valid" | "invalid" | "missing" | "disabled";
type ProcessingStatus = "received" | "processed" | "skipped" | "rejected";

interface WebhookContext {
  authStatus: AuthStatus;
  connection: {
    id: number;
    instance_name: string;
    name: string;
    phone: string | null;
    status: string;
    tenant_id: number;
  } | null;
  eventName: string | null;
  instanceName: string | null;
  payload: Record<string, unknown>;
  service: ReturnType<typeof createServiceClient>;
  tenantId: number | null;
}

const extractPayload = (body: unknown): Record<string, unknown> => {
  if (typeof body === "object" && body) return body as Record<string, unknown>;
  return {};
};

const resolveEventName = (payload: Record<string, unknown>) => {
  const event = payload.event ?? payload.type;
  return typeof event === "string" ? event : null;
};

const resolveInstanceName = (payload: Record<string, unknown>) => {
  const direct = payload.instance ?? payload.instanceName;
  if (typeof direct === "string") return direct;
  if (typeof direct === "object" && direct && "instanceName" in direct) {
    const value = (direct as { instanceName?: unknown }).instanceName;
    if (typeof value === "string") return value;
  }
  return null;
};

const resolveConnectionState = (payload: Record<string, unknown>) => {
  const data = payload.data;
  if (typeof data === "object" && data) {
    const state = (data as { state?: unknown }).state;
    if (typeof state === "string") return state;
  }
  const state = payload.state;
  return typeof state === "string" ? state : null;
};

const logWebhookIngest = async (
  ctx: WebhookContext,
  processingStatus: ProcessingStatus,
  errorMessage?: string | null,
) => {
  await ctx.service.from("whatsapp_webhook_ingest_logs").insert({
    auth_status: ctx.authStatus,
    error_message: errorMessage ?? null,
    event: ctx.eventName,
    instance_name: ctx.instanceName,
    payload: buildIngestPayloadSummary(ctx.payload),
    processing_status: processingStatus,
    tenant_id: ctx.tenantId,
  });
};

const buildIngestPayloadSummary = (payload: Record<string, unknown>) => ({
  event: payload.event ?? payload.type ?? null,
  instance: payload.instance ?? payload.instanceName ?? null,
});

const validateWebhookAuth = async (
  service: ReturnType<typeof createServiceClient>,
  req: Request,
  instanceName: string | null,
): Promise<AuthStatus> => {
  const globalToken = Deno.env.get("EVOLUTION_WEBHOOK_TOKEN") ?? null;
  const incomingToken = req.headers.get("x-webhook-token");

  let expectedToken: string | null = null;
  if (instanceName) {
    const { data: secretRow } = await service
      .from("whatsapp_connection_webhook_secrets")
      .select("webhook_token")
      .eq("instance_name", instanceName)
      .maybeSingle();

    if (secretRow?.webhook_token) {
      expectedToken = secretRow.webhook_token;
    } else {
      const { data: connection } = await service
        .from("whatsapp_connections")
        .select("id")
        .eq("instance_name", instanceName)
        .maybeSingle();

      if (connection) {
        const { data: secretByConnection } = await service
          .from("whatsapp_connection_webhook_secrets")
          .select("webhook_token")
          .eq("connection_id", connection.id)
          .maybeSingle();
        expectedToken = secretByConnection?.webhook_token ?? globalToken;
      } else {
        expectedToken = globalToken;
      }
    }
  } else {
    expectedToken = globalToken;
  }

  if (!expectedToken) return "disabled";
  if (!incomingToken) return "missing";
  if (incomingToken !== expectedToken) return "invalid";
  return "valid";
};

const handleConnectionUpdate = async (ctx: WebhookContext) => {
  if (!ctx.connection) return;

  const state = resolveConnectionState(ctx.payload);
  const updates: Record<string, unknown> = {
    last_seen_at: new Date().toISOString(),
    last_error: null,
  };

  if (state === "open") {
    updates.status = "connected";
    updates.qr_code = null;
    updates.phone = extractConnectionPhone(ctx.payload) ?? undefined;
    try {
      await syncConnectionWebhook(ctx.service, ctx.connection);
    } catch {
      // best-effort — garante webhookBase64 nas instâncias existentes
    }
    try {
      const { data: tenant } = await ctx.service
        .from("tenants")
        .select("id, name, slug")
        .eq("id", ctx.connection.tenant_id)
        .maybeSingle();
      if (tenant) {
        await syncTenantN8nEvolutionAutomation(ctx.service, tenant, ctx.connection);
      }
    } catch {
      // best-effort
    }
  } else if (state === "close") {
    updates.status = "disconnected";
    updates.qr_code = null;
  }

  const { error: updateError } = await ctx.service
    .from("whatsapp_connections")
    .update(updates)
    .eq("id", ctx.connection.id);

  if (updateError) throw updateError;

  await logWebhookIngest(ctx, "processed");
};

const isDuplicateKeyError = (error: { code?: string; message?: string } | null) =>
  error?.code === "23505" || Boolean(error?.message?.includes("automation_dispatch_logs_inbound_dedupe_idx"));

const logAutomationDispatch = async (
  ctx: WebhookContext,
  input: {
    connectionId: number;
    customerPhone: string | null;
    direction: "inbound_to_n8n";
    errorMessage?: string | null;
    event: string;
    messageId: string | null;
    n8nResponseStatus?: number | null;
    n8nStatus: "pending" | "sent" | "failed" | "skipped";
    payload?: Record<string, unknown> | null;
  },
) => {
  await ctx.service.from("automation_dispatch_logs").insert({
    connection_id: input.connectionId,
    customer_phone: input.customerPhone,
    direction: input.direction,
    error_message: input.errorMessage ?? null,
    event: input.event,
    instance_name: ctx.instanceName,
    message_id: input.messageId,
    n8n_response_status: input.n8nResponseStatus ?? null,
    n8n_status: input.n8nStatus,
    payload: input.payload ?? null,
    tenant_id: ctx.tenantId,
  });
};

const handleMessagesUpsert = async (ctx: WebhookContext) => {
  if (!ctx.connection || !ctx.eventName) return;

  const messages = parseEvolutionMessages(ctx.payload);
  if (messages.length === 0) {
    await logWebhookIngest(ctx, "skipped", "Nenhuma mensagem válida no payload.");
    return;
  }

  const { data: tenant, error: tenantError } = await ctx.service
    .from("tenants")
    .select("id, slug")
    .eq("id", ctx.connection.tenant_id)
    .maybeSingle();

  if (tenantError) throw tenantError;
  if (!tenant) {
    await logWebhookIngest(ctx, "skipped", "Tenant não encontrado.");
    return;
  }

  const { data: automationSettings } = await ctx.service
    .from("tenant_automation_settings")
    .select(
      "automation_template_bindings, inbound_automation_enabled, n8n_inbound_webhook_url, n8n_provision_status, n8n_routing_key",
    )
    .eq("tenant_id", tenant.id)
    .maybeSingle();

  const tenantWebhookUrl =
    typeof automationSettings?.n8n_inbound_webhook_url === "string"
      ? automationSettings.n8n_inbound_webhook_url
      : null;

  const atendimentoConnectionId = resolveAutomationConnectionId(
    automationSettings?.automation_template_bindings,
    ATENDIMENTO_TEMPLATE_KEY,
  );

  let isAtendimentoConnection =
    atendimentoConnectionId !== null && atendimentoConnectionId === ctx.connection.id;

  if (!isAtendimentoConnection && atendimentoConnectionId !== null) {
    const { data: boundConnection } = await ctx.service
      .from("whatsapp_connections")
      .select("id, instance_name, phone")
      .eq("id", atendimentoConnectionId)
      .maybeSingle();

    if (boundConnection) {
      isAtendimentoConnection =
        boundConnection.instance_name === ctx.connection.instance_name ||
        phonesMatch(boundConnection.phone, ctx.connection.phone);
    }
  }

  const canForward =
    isAtendimentoConnection &&
    automationSettings?.inbound_automation_enabled === true &&
    automationSettings?.n8n_provision_status === "active" &&
    Boolean(tenantWebhookUrl);

  for (const message of messages) {
    if (isInboundCustomerReplyMessage(message)) {
      try {
        await pausePropostaFollowupOnCustomerReply(ctx.service, {
          customerPhone: message.customerPhone as string,
          respondedAt: new Date().toISOString(),
          tenantId: tenant.id,
        });
      } catch (pauseError) {
        console.error(
          "pausePropostaFollowupOnCustomerReply failed:",
          pauseError instanceof Error ? pauseError.message : pauseError,
        );
      }
    }

    const skipReason = shouldSkipMessage(message);
    if (skipReason) {
      await logWebhookIngest(ctx, "skipped", `Mensagem ignorada: ${skipReason}.`);
      continue;
    }

    if (isHumanInterventionMessage(message)) {
      const isKnownAutomation = await isKnownAutomationOutboundMessage(ctx.service, {
        messageId: message.id,
        tenantId: tenant.id,
      });
      if (isKnownAutomation) {
        await logWebhookIngest(ctx, "skipped", "Mensagem ignorada: eco de automação (fromMe).");
        continue;
      }
    }

    // Lead em Contato Inicial só nasce quando o cliente inicia conversa no número de Atendimento.
    // Workflows outbound (7 dias, boas-vindas, follow-up etc.) não devem criar leads ao receber respostas.
    if (isAtendimentoConnection && !message.fromMe) {
      try {
        await ensureVendasLeadFromWhatsapp(ctx.service, {
          customerName: message.customerName,
          customerPhone: message.customerPhone as string,
          inboundMessage: {
            text: message.text,
            type: message.type,
          },
          tenantId: tenant.id,
        });
      } catch (leadError) {
        const leadMessage = leadError instanceof Error ? leadError.message : "Erro ao garantir lead em Vendas.";
        await logWebhookIngest(ctx, "skipped", `Lead não criado: ${leadMessage}`);
      }
    }

    if (!canForward) {
      const skipMessage =
        atendimentoConnectionId === null
          ? "Automação de Atendimento sem número WhatsApp vinculado."
          : !isAtendimentoConnection
            ? "Mensagem recebida em número diferente do vinculado à automação de Atendimento."
            : automationSettings?.n8n_provision_status === "draft"
              ? "Workflow N8N em rascunho — personalize, publique no N8N e salve novamente o vínculo de Atendimento."
              : !automationSettings?.inbound_automation_enabled
                ? "Automação de Atendimento ainda não foi ativada — salve o vínculo na tela de Automações."
                : !tenantWebhookUrl
                  ? "URL do workflow N8N não configurada."
                  : "Automação inbound não liberada.";

      await logAutomationDispatch(ctx, {
        connectionId: ctx.connection.id,
        customerPhone: message.customerPhone,
        direction: "inbound_to_n8n",
        errorMessage: skipMessage,
        event: ctx.eventName,
        messageId: message.id,
        n8nStatus: "skipped",
        payload: {
          message: { customerPhone: message.customerPhone, id: message.id },
          tenant: { id: tenant.id, slug: tenant.slug },
        },
      });
      continue;
    }

    let mediaBase64 = message.mediaBase64;
    let mediaMimetype = message.mediaMimetype;

    if (
      isMediaMessageType(message.type) &&
      !mediaBase64 &&
      message.id &&
      ctx.instanceName
    ) {
      const fetched = await fetchMessageMediaBase64(
        ctx.instanceName,
        message.id,
        message.remoteJid,
        message.type === "video",
      );
      mediaBase64 = fetched.base64;
      mediaMimetype = mediaMimetype ?? fetched.mimetype;
    }

    const n8nPayload = buildN8nInboundPayload({
      connection: ctx.connection,
      event: ctx.eventName,
      message: {
        customerName: message.customerName,
        customerPhone: message.customerPhone as string,
        fromMe: message.fromMe,
        id: message.id,
        mediaBase64,
        mediaMimetype,
        text: message.text as string,
        timestamp: message.timestamp,
        type: message.type,
      },
      tenant,
    });

    const logPayload = buildLogPayload(n8nPayload);

    const { data: dispatchLog, error: dedupeError } = await ctx.service
      .from("automation_dispatch_logs")
      .insert({
        connection_id: ctx.connection.id,
        customer_phone: message.customerPhone,
        direction: "inbound_to_n8n",
        event: ctx.eventName,
        instance_name: ctx.instanceName,
        message_id: message.id,
        n8n_status: "pending",
        payload: logPayload,
        tenant_id: tenant.id,
      })
      .select("id")
      .single();

    if (isDuplicateKeyError(dedupeError)) {
      await logWebhookIngest(ctx, "skipped", "Mensagem duplicada ignorada.");
      continue;
    }

    if (dedupeError) throw dedupeError;

    if (!message.fromMe) {
      try {
        await persistAgentConversationMessage(ctx.service, {
          connectionId: ctx.connection.id,
          content: message.text as string,
          customerPhone: message.customerPhone as string,
          messageId: message.id,
          metadata: {
            customerName: message.customerName,
            direction: "inbound",
            messageType: message.type,
            source: "whatsapp",
          },
          role: "human",
          tenantId: tenant.id,
        });
      } catch (memoryError) {
        console.error(
          "agent_conversation_messages insert failed:",
          memoryError instanceof Error ? memoryError.message : memoryError,
        );
      }
    }

    const forwardResult = await forwardToN8n(n8nPayload, tenantWebhookUrl as string);

    const { error: updateLogError } = await ctx.service
      .from("automation_dispatch_logs")
      .update({
        error_message: forwardResult.errorMessage,
        n8n_response_status: forwardResult.responseStatus,
        n8n_status: forwardResult.ok ? "sent" : "failed",
      })
      .eq("id", dispatchLog.id);

    if (updateLogError) throw updateLogError;

    await logWebhookIngest(
      ctx,
      forwardResult.ok ? "processed" : "skipped",
      forwardResult.ok ? null : forwardResult.errorMessage,
    );
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }

  const service = createServiceClient();
  let payload: Record<string, unknown> = {};
  let instanceName: string | null = null;
  let eventName: string | null = null;
  let authStatus: AuthStatus = "missing";
  let tenantId: number | null = null;

  try {
    payload = extractPayload(await req.json());
    eventName = resolveEventName(payload);
    instanceName = resolveInstanceName(payload);

    if (isVilaEncantadaProductionInstance(instanceName)) {
      try {
        await ensureVilaEncantadaInboundRouting(service, 2);
      } catch (routingError) {
        console.error(
          "ensureVilaEncantadaInboundRouting failed:",
          routingError instanceof Error ? routingError.message : routingError,
        );
      }
    }

    authStatus = await validateWebhookAuth(service, req, instanceName);

    if (authStatus !== "valid") {
      await service.from("whatsapp_webhook_ingest_logs").insert({
        auth_status: authStatus,
        error_message: "Token de webhook inválido ou ausente.",
        event: eventName,
        instance_name: instanceName,
        payload: buildIngestPayloadSummary(payload),
        processing_status: "rejected",
        tenant_id: null,
      });
      return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
    }

    if (!instanceName) {
      await service.from("whatsapp_webhook_ingest_logs").insert({
        auth_status: authStatus,
        error_message: "instance_name ausente no payload.",
        event: eventName,
        instance_name: null,
        payload: buildIngestPayloadSummary(payload),
        processing_status: "skipped",
      });
      return jsonResponse({ ok: true, skipped: true });
    }

    const { data: connection } = await service
      .from("whatsapp_connections")
      .select("id, tenant_id, status, name, instance_name, phone")
      .eq("instance_name", instanceName)
      .maybeSingle();

    if (!connection) {
      await service.from("whatsapp_webhook_ingest_logs").insert({
        auth_status: authStatus,
        error_message: "Conexão não encontrada para a instância.",
        event: eventName,
        instance_name: instanceName,
        payload: buildIngestPayloadSummary(payload),
        processing_status: "skipped",
      });
      return jsonResponse({ ok: true, skipped: true });
    }

    tenantId = connection.tenant_id;

    const ctx: WebhookContext = {
      authStatus,
      connection,
      eventName,
      instanceName,
      payload,
      service,
      tenantId,
    };

    if (isConnectionUpdateEvent(eventName)) {
      await handleConnectionUpdate(ctx);
      return jsonResponse({ ok: true });
    }

    if (isMessagesUpsertEvent(eventName)) {
      await handleMessagesUpsert(ctx);
      return jsonResponse({ ok: true });
    }

    await logWebhookIngest(ctx, "skipped");
    return jsonResponse({ ok: true, skipped: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro inesperado.";

    await service.from("whatsapp_webhook_ingest_logs").insert({
      auth_status: authStatus,
      error_message: errorMessage,
      event: eventName,
      instance_name: instanceName,
      payload: buildIngestPayloadSummary(payload),
      processing_status: "rejected",
      tenant_id: tenantId,
    });

    return jsonResponse({ ok: true, error: errorMessage });
  }
});
