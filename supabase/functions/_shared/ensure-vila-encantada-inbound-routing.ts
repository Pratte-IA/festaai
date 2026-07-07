type ServiceClient = ReturnType<
  typeof import("./auth-tenant.ts").createServiceClient
>;

export const VILA_ENCANTADA_TENANT_ID = 2;

export const VILA_ENCANTADA_N8N_INBOUND_WEBHOOK_URL =
  "https://webhooks.pratte.com.br/webhook/2808ab7b-d03d-43be-95d2-e2952f3a4ab3";

/** Instância Evolution de produção do tenant Vila Encantada (WhatsApp Luana). */
export const VILA_ENCANTADA_INSTANCE_NAME = "festaai-vila-encantada-1783106792370-427490";

export const VILA_ENCANTADA_CONNECTION_NAME = "WhatsApp Luana";
export const VILA_ENCANTADA_PHONE = "48999672473";

/** Token configurado na Evolution para esta instância. */
export const VILA_ENCANTADA_WEBHOOK_TOKEN = "072427bb87354c1ba16434c71fc3b225";

const VILA_ENCANTADA_INSTANCE_PREFIX = "festaai-vila-encantada-";

interface WhatsappConnectionRow {
  id: number;
  instance_name: string;
  name: string;
  phone: string | null;
  status: string;
}

const updateAtendimentoBinding = async (
  service: ServiceClient,
  tenantId: number,
  connectionId: number,
) => {
  const { data: settings, error: settingsError } = await service
    .from("tenant_automation_settings")
    .select("automation_template_bindings")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (settingsError) throw settingsError;

  const currentBindings = Array.isArray(settings?.automation_template_bindings)
    ? (settings.automation_template_bindings as Array<Record<string, unknown>>)
    : [];

  let foundAtendimento = false;
  const nextBindings = currentBindings.map((binding) => {
    if (binding.key !== "atendimento") return binding;
    foundAtendimento = true;
    return { ...binding, connectionId };
  });

  if (!foundAtendimento) {
    nextBindings.push({ key: "atendimento", connectionId });
  }

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
};

export const isVilaEncantadaProductionInstance = (instanceName: string | null): boolean =>
  typeof instanceName === "string" &&
  (instanceName === VILA_ENCANTADA_INSTANCE_NAME ||
    instanceName.startsWith(VILA_ENCANTADA_INSTANCE_PREFIX));

export const ensureVilaEncantadaInboundRouting = async (
  service: ServiceClient,
  tenantId: number,
): Promise<WhatsappConnectionRow | null> => {
  if (tenantId !== VILA_ENCANTADA_TENANT_ID) return null;

  const { data: existingConnection, error: existingError } = await service
    .from("whatsapp_connections")
    .select("id, instance_name, name, phone, status")
    .eq("tenant_id", tenantId)
    .eq("instance_name", VILA_ENCANTADA_INSTANCE_NAME)
    .maybeSingle();

  if (existingError) throw existingError;

  let connection = existingConnection as WhatsappConnectionRow | null;

  if (!connection) {
    const { data: legacyConnection } = await service
      .from("whatsapp_connections")
      .select("id, instance_name, name, phone, status")
      .eq("tenant_id", tenantId)
      .or("instance_name.eq.Vila - Luana,name.ilike.%Luana%")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (legacyConnection) {
      const { data: migrated, error: migrateError } = await service
        .from("whatsapp_connections")
        .update({
          instance_name: VILA_ENCANTADA_INSTANCE_NAME,
          name: VILA_ENCANTADA_CONNECTION_NAME,
          phone: VILA_ENCANTADA_PHONE,
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
          instance_name: VILA_ENCANTADA_INSTANCE_NAME,
          name: VILA_ENCANTADA_CONNECTION_NAME,
          phone: VILA_ENCANTADA_PHONE,
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
        name: VILA_ENCANTADA_CONNECTION_NAME,
        phone: VILA_ENCANTADA_PHONE,
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
      instance_name: VILA_ENCANTADA_INSTANCE_NAME,
      webhook_token: VILA_ENCANTADA_WEBHOOK_TOKEN,
    },
    { onConflict: "connection_id" },
  );

  if (secretError) throw secretError;

  await updateAtendimentoBinding(service, tenantId, connection.id);

  return connection;
};
