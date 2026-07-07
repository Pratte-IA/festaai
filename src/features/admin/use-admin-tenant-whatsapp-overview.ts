import { useQuery } from "@tanstack/react-query";

import { AUTOMATION_TEMPLATE_CATALOG } from "@/features/automations/automation-catalog";
import {
  mergeAutomationTemplateBindings,
  parseAutomationTemplateBindings,
} from "@/features/automations/parse-automation-bindings";
import type { AutomationTemplateKey } from "@/features/automations/types";
import { supabase } from "@/lib/supabase/client";

export interface AdminTenantWhatsappConnection {
  createdAt: string;
  id: number;
  instanceName: string;
  name: string;
  phone: string | null;
  status: string;
}

export interface AdminTenantAutomationBindingView {
  automationKey: AutomationTemplateKey;
  automationTitle: string;
  bindingMode: "phone_number" | "whatsapp_connection";
  connection: AdminTenantWhatsappConnection | null;
  direction: "inbound" | "outbound";
  forwardPhone: string | null;
  usesN8nWebhook: boolean;
}

export interface AdminTenantWhatsappOverview {
  automations: AdminTenantAutomationBindingView[];
  connections: AdminTenantWhatsappConnection[];
  tenantId: number;
}

export const adminTenantWhatsappOverviewQueryKey = (tenantId: number) =>
  ["admin", "tenant-whatsapp-overview", tenantId] as const;

const N8N_WEBHOOK_AUTOMATION_KEYS = new Set<AutomationTemplateKey>([
  "atendimento",
  "boas-vindas",
  "sete-dias-antes",
]);

const mapConnection = (row: Record<string, unknown>): AdminTenantWhatsappConnection => ({
  createdAt: typeof row.created_at === "string" ? row.created_at : "",
  id: Number(row.id),
  instanceName: typeof row.instance_name === "string" ? row.instance_name : "",
  name: typeof row.name === "string" ? row.name : "Sem nome",
  phone: typeof row.phone === "string" ? row.phone : null,
  status: typeof row.status === "string" ? row.status : "unknown",
});

const fetchAdminTenantWhatsappOverview = async (tenantId: number): Promise<AdminTenantWhatsappOverview> => {
  const [connectionsResult, settingsResult] = await Promise.all([
    supabase
      .from("whatsapp_connections")
      .select("id, name, instance_name, phone, status, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: true }),
    supabase
      .from("tenant_automation_settings")
      .select("automation_template_bindings")
      .eq("tenant_id", tenantId)
      .maybeSingle(),
  ]);

  if (connectionsResult.error) throw connectionsResult.error;
  if (settingsResult.error) throw settingsResult.error;

  const connections = (connectionsResult.data ?? []).map((row) =>
    mapConnection(row as Record<string, unknown>),
  );
  const connectionsById = new Map(connections.map((connection) => [connection.id, connection]));

  const bindings = mergeAutomationTemplateBindings(
    parseAutomationTemplateBindings(settingsResult.data?.automation_template_bindings),
  );

  const automations: AdminTenantAutomationBindingView[] = AUTOMATION_TEMPLATE_CATALOG.map((template) => {
    const binding = bindings.find((item) => item.key === template.key);

    return {
      automationKey: template.key,
      automationTitle: template.title,
      bindingMode: template.bindingMode,
      connection: binding?.connectionId ? connectionsById.get(binding.connectionId) ?? null : null,
      direction: template.direction,
      forwardPhone: binding?.forwardPhone ?? null,
      usesN8nWebhook: N8N_WEBHOOK_AUTOMATION_KEYS.has(template.key),
    };
  });

  return {
    automations,
    connections,
    tenantId,
  };
};

export const useAdminTenantWhatsappOverview = (tenantId: number | null) =>
  useQuery({
    enabled: Boolean(tenantId),
    queryFn: () => fetchAdminTenantWhatsappOverview(tenantId as number),
    queryKey: adminTenantWhatsappOverviewQueryKey(tenantId as number),
    staleTime: 1000 * 15,
  });

export const getAutomationsForConnection = (
  connectionId: number,
  automations: AdminTenantAutomationBindingView[],
) =>
  automations.filter(
    (automation) => automation.connection?.id === connectionId && automation.bindingMode === "whatsapp_connection",
  );
