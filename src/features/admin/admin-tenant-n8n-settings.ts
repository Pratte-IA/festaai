/** Automações que disparam via webhook N8N (configuração manual na admin). */
export const N8N_AUTOMATION_WEBHOOKS = [
  {
    key: "atendimento",
    label: "Atendimento",
    description: "Recebe mensagens inbound do WhatsApp e conduz o atendimento comercial.",
    direction: "inbound" as const,
    storage: "inbound" as const,
  },
  {
    key: "boas-vindas",
    label: "Boas Vindas",
    description: "Disparada após o fechamento da festa.",
    direction: "outbound" as const,
    storage: "outbound" as const,
  },
  {
    key: "sete-dias-antes",
    label: "7 dias Antes da Festa",
    description: "Lembrete enviado uma semana antes da data da festa.",
    direction: "outbound" as const,
    storage: "outbound" as const,
  },
] as const;

export type N8nAutomationWebhookKey = (typeof N8N_AUTOMATION_WEBHOOKS)[number]["key"];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const parseOutboundWebhookUrls = (raw: unknown): Record<string, string> => {
  if (!isRecord(raw)) return {};

  return Object.fromEntries(
    Object.entries(raw).flatMap(([key, value]) => {
      if (typeof value !== "string") return [];
      const trimmed = value.trim();
      return trimmed ? [[key, trimmed]] : [];
    }),
  );
};

export const serializeOutboundWebhookUrls = (urls: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(urls).flatMap(([key, value]) => {
      const trimmed = value.trim();
      return trimmed ? [[key, trimmed]] : [];
    }),
  );

export interface AdminTenantN8nSettingsForm {
  clearLastError: boolean;
  inboundAutomationEnabled: boolean;
  webhookUrls: Record<N8nAutomationWebhookKey, string>;
}

export interface AdminTenantN8nSettingsRow {
  configuredWebhookCount: number;
  form: AdminTenantN8nSettingsForm;
  n8nLastError: string | null;
  updatedAt: string | null;
}

const defaultWebhookUrls = (): Record<N8nAutomationWebhookKey, string> =>
  Object.fromEntries(N8N_AUTOMATION_WEBHOOKS.map((item) => [item.key, ""])) as Record<
    N8nAutomationWebhookKey,
    string
  >;

export const buildDefaultAdminTenantN8nSettingsForm = (): AdminTenantN8nSettingsForm => ({
  clearLastError: false,
  inboundAutomationEnabled: false,
  webhookUrls: defaultWebhookUrls(),
});

export const mapAdminTenantN8nSettingsRow = (
  row: Record<string, unknown> | null,
): AdminTenantN8nSettingsRow => {
  const outboundParsed = parseOutboundWebhookUrls(row?.n8n_outbound_webhook_urls);
  const inboundUrl =
    typeof row?.n8n_inbound_webhook_url === "string" ? row.n8n_inbound_webhook_url.trim() : "";

  const webhookUrls = {
    ...defaultWebhookUrls(),
    atendimento: inboundUrl,
    "boas-vindas": outboundParsed["boas-vindas"] ?? "",
    "sete-dias-antes": outboundParsed["sete-dias-antes"] ?? "",
  };

  const configuredWebhookCount = Object.values(webhookUrls).filter(Boolean).length;

  return {
    configuredWebhookCount,
    form: {
      clearLastError: false,
      inboundAutomationEnabled: row?.inbound_automation_enabled === true,
      webhookUrls,
    },
    n8nLastError: typeof row?.n8n_last_error === "string" ? row.n8n_last_error : null,
    updatedAt: typeof row?.updated_at === "string" ? row.updated_at : null,
  };
};

export const buildN8nSettingsPayload = (
  form: AdminTenantN8nSettingsForm,
  tenantId: number,
): Record<string, unknown> => {
  const inboundWebhook = form.webhookUrls.atendimento.trim();
  const outboundWebhookUrls = serializeOutboundWebhookUrls({
    "boas-vindas": form.webhookUrls["boas-vindas"],
    "sete-dias-antes": form.webhookUrls["sete-dias-antes"],
  });

  const inboundActive = form.inboundAutomationEnabled && Boolean(inboundWebhook);

  const payload: Record<string, unknown> = {
    inbound_automation_enabled: inboundActive,
    n8n_inbound_webhook_url: inboundWebhook || null,
    n8n_outbound_webhook_urls: outboundWebhookUrls,
    n8n_provision_status: inboundActive ? "active" : "draft",
    tenant_id: tenantId,
  };

  if (form.clearLastError) {
    payload.n8n_last_error = null;
  }

  if (inboundActive) {
    payload.n8n_provisioned_at = new Date().toISOString();
  }

  return payload;
};
