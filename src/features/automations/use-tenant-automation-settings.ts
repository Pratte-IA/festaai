import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

import { serializeAutomationTemplateBindings } from "./parse-automation-bindings";
import {
  buildDefaultAutomationSettingsView,
  parseTenantAutomationSettingsRow,
} from "./parse-n8n-workflows";
import type { AutomationTemplateBindingRow, TenantAutomationSettingsView } from "./types";

export const automationsQueryKey = (tenantId: number | null) =>
  ["automations", tenantId, "settings"] as const;

export const useTenantAutomationSettings = () => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(currentTenantId),
    queryFn: async (): Promise<TenantAutomationSettingsView> => {
      const { data, error } = await supabase
        .from("tenant_automation_settings")
        .select(
          "automation_template_bindings, inbound_automation_enabled, n8n_editor_url, n8n_provision_status, n8n_workflow_id, n8n_workflows",
        )
        .eq("tenant_id", currentTenantId as number)
        .maybeSingle();

      if (error) throw error;
      if (!data) return buildDefaultAutomationSettingsView();

      return parseTenantAutomationSettingsRow(data);
    },
    queryKey: automationsQueryKey(currentTenantId),
  });
};

export const useUpdateAutomationTemplateBindings = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();

  return useMutation({
    mutationFn: async (bindings: AutomationTemplateBindingRow[]) => {
      if (!currentTenantId) throw new Error("Tenant atual indisponível.");

      const serialized = serializeAutomationTemplateBindings(bindings);
      const atendimentoConnectionId =
        bindings.find((binding) => binding.key === "atendimento")?.connectionId ?? null;

      const { data: existingSettings, error: existingError } = await supabase
        .from("tenant_automation_settings")
        .select("n8n_inbound_webhook_url")
        .eq("tenant_id", currentTenantId)
        .maybeSingle();

      if (existingError) throw existingError;

      const hasInboundWebhook = Boolean(existingSettings?.n8n_inbound_webhook_url?.trim());
      const shouldActivateAtendimento =
        atendimentoConnectionId !== null && hasInboundWebhook;

      const { error: upsertError } = await supabase.from("tenant_automation_settings").upsert(
        {
          automation_template_bindings: serialized,
          tenant_id: currentTenantId,
          ...(shouldActivateAtendimento
            ? {
                inbound_automation_enabled: true,
                n8n_provision_status: "active",
              }
            : atendimentoConnectionId === null
              ? { inbound_automation_enabled: false }
              : {}),
        },
        { onConflict: "tenant_id" },
      );

      if (upsertError) throw upsertError;

      return bindings;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: automationsQueryKey(currentTenantId) });
    },
  });
};
