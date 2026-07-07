type ServiceClient = ReturnType<
  typeof import("./auth-tenant.ts").createServiceClient
>;

export const VILA_ENCANTADA_TENANT_ID = 2;

/** Workflow inbound de Atendimento (recebe mensagens do WhatsApp Principal). */
export const VILA_ENCANTADA_N8N_INBOUND_WEBHOOK_URL =
  "https://webhooks.pratte.com.br/webhook/2808ab7b-d03d-43be-95d2-e2952f3a4ab3";

/** Instância Evolution do WhatsApp Principal (4891664516) — atendimento inbound. */
export const VILA_ENCANTADA_PRINCIPAL_INSTANCE_NAME =
  "festaai-vila-encantada-1781746380080-711495";

export const VILA_ENCANTADA_PRINCIPAL_CONNECTION_NAME = "WhatsApp Principal";
export const VILA_ENCANTADA_PRINCIPAL_PHONE = "4891664516";
export const VILA_ENCANTADA_PRINCIPAL_WEBHOOK_TOKEN = "f4e8a2c91b3d46578e0f1a2b3c4d5e6f";

/** Instância Evolution do WhatsApp Luana (48999672473) — automações outbound. */
export const VILA_ENCANTADA_LUANA_INSTANCE_NAME = "festaai-vila-encantada-1783106792370-427490";

export const VILA_ENCANTADA_LUANA_CONNECTION_NAME = "WhatsApp Luana";
export const VILA_ENCANTADA_LUANA_PHONE = "48999672473";
export const VILA_ENCANTADA_LUANA_WEBHOOK_TOKEN = "072427bb87354c1ba16434c71fc3b225";

/** @deprecated Use VILA_ENCANTADA_LUANA_INSTANCE_NAME */
export const VILA_ENCANTADA_INSTANCE_NAME = VILA_ENCANTADA_LUANA_INSTANCE_NAME;

/** @deprecated Use VILA_ENCANTADA_LUANA_CONNECTION_NAME */
export const VILA_ENCANTADA_CONNECTION_NAME = VILA_ENCANTADA_LUANA_CONNECTION_NAME;

/** @deprecated Use VILA_ENCANTADA_LUANA_PHONE */
export const VILA_ENCANTADA_PHONE = VILA_ENCANTADA_LUANA_PHONE;

/** @deprecated Use VILA_ENCANTADA_LUANA_WEBHOOK_TOKEN */
export const VILA_ENCANTADA_WEBHOOK_TOKEN = VILA_ENCANTADA_LUANA_WEBHOOK_TOKEN;

interface WhatsappConnectionRow {
  id: number;
  instance_name: string;
  name: string;
  phone: string | null;
  status: string;
}

const upsertConnectionBinding = (
  bindings: Array<Record<string, unknown>>,
  key: string,
  connectionId: number,
): Array<Record<string, unknown>> => {
  let found = false;
  const next = bindings.map((binding) => {
    if (binding.key !== key) return binding;
    found = true;
    return { ...binding, connectionId };
  });

  if (!found) {
    next.push({ key, connectionId });
  }

  return next;
};

const ensureConnectionRow = async (
  service: ServiceClient,
  tenantId: number,
  input: {
    connectionName: string;
    fallbackNamePattern: string;
    instanceName: string;
    phone: string;
    webhookToken: string;
  },
): Promise<WhatsappConnectionRow> => {
  const { data: existingConnection, error: existingError } = await service
    .from("whatsapp_connections")
    .select("id, instance_name, name, phone, status")
    .eq("tenant_id", tenantId)
    .eq("instance_name", input.instanceName)
    .maybeSingle();

  if (existingError) throw existingError;

  let connection = existingConnection as WhatsappConnectionRow | null;

  if (!connection) {
    const { data: legacyConnection } = await service
      .from("whatsapp_connections")
      .select("id, instance_name, name, phone, status")
      .eq("tenant_id", tenantId)
      .or(`instance_name.eq.${input.instanceName},name.ilike.%${input.fallbackNamePattern}%`)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (legacyConnection) {
      const { data: migrated, error: migrateError } = await service
        .from("whatsapp_connections")
        .update({
          instance_name: input.instanceName,
          name: input.connectionName,
          phone: input.phone,
          status: "connected",
          last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", legacyConnection.id)
        .select("id, instance_name, name, phone, status")
        .single();

      if (migrateError) throw migrateError;
      connection = migrated;
    } else {
      const { data: created, error: createError } = await service
        .from("whatsapp_connections")
        .insert({
          instance_name: input.instanceName,
          name: input.connectionName,
          phone: input.phone,
          status: "connected",
          tenant_id: tenantId,
        })
        .select("id, instance_name, name, phone, status")
        .single();

      if (createError) throw createError;
      connection = created;
    }
  } else {
    const { data: updated, error: updateError } = await service
      .from("whatsapp_connections")
      .update({
        name: input.connectionName,
        phone: input.phone,
        status: "connected",
        last_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", connection.id)
      .select("id, instance_name, name, phone, status")
      .single();

    if (updateError) throw updateError;
    connection = updated;
  }

  const { error: secretError } = await service.from("whatsapp_connection_webhook_secrets").upsert(
    {
      connection_id: connection.id,
      instance_name: input.instanceName,
      webhook_token: input.webhookToken,
    },
    { onConflict: "connection_id" },
  );

  if (secretError) throw secretError;

  return connection;
};

/**
 * Garante vínculos corretos da Vila Encantada:
 * - Atendimento (inbound) → WhatsApp Principal
 * - Boas-vindas / 7 dias (outbound) → WhatsApp Luana
 */
export const ensureVilaEncantadaInboundRouting = async (
  service: ServiceClient,
  tenantId: number,
): Promise<WhatsappConnectionRow | null> => {
  if (tenantId !== VILA_ENCANTADA_TENANT_ID) return null;

  const [principalConnection, luanaConnection] = await Promise.all([
    ensureConnectionRow(service, tenantId, {
      connectionName: VILA_ENCANTADA_PRINCIPAL_CONNECTION_NAME,
      fallbackNamePattern: "Principal",
      instanceName: VILA_ENCANTADA_PRINCIPAL_INSTANCE_NAME,
      phone: VILA_ENCANTADA_PRINCIPAL_PHONE,
      webhookToken: VILA_ENCANTADA_PRINCIPAL_WEBHOOK_TOKEN,
    }),
    ensureConnectionRow(service, tenantId, {
      connectionName: VILA_ENCANTADA_LUANA_CONNECTION_NAME,
      fallbackNamePattern: "Luana",
      instanceName: VILA_ENCANTADA_LUANA_INSTANCE_NAME,
      phone: VILA_ENCANTADA_LUANA_PHONE,
      webhookToken: VILA_ENCANTADA_LUANA_WEBHOOK_TOKEN,
    }),
  ]);

  const { data: settings, error: settingsError } = await service
    .from("tenant_automation_settings")
    .select("automation_template_bindings")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (settingsError) throw settingsError;

  const currentBindings = Array.isArray(settings?.automation_template_bindings)
    ? (settings.automation_template_bindings as Array<Record<string, unknown>>)
    : [];

  let nextBindings = currentBindings;
  nextBindings = upsertConnectionBinding(nextBindings, "atendimento", principalConnection.id);
  nextBindings = upsertConnectionBinding(nextBindings, "boas-vindas", luanaConnection.id);
  nextBindings = upsertConnectionBinding(nextBindings, "sete-dias-antes", luanaConnection.id);

  const { error: upsertError } = await service.from("tenant_automation_settings").upsert(
    {
      automation_template_bindings: nextBindings,
      inbound_automation_enabled: true,
      n8n_inbound_webhook_url: VILA_ENCANTADA_N8N_INBOUND_WEBHOOK_URL,
      n8n_provision_status: "active",
      tenant_id: tenantId,
    },
    { onConflict: "tenant_id" },
  );

  if (upsertError) throw upsertError;

  return principalConnection;
};

/** @deprecated Não usar no webhook — rebinding automático quebra o vínculo do Principal. */
export const isVilaEncantadaProductionInstance = (instanceName: string | null): boolean => false;
