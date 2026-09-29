import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

import {
  buildDefaultAdminTenantN8nSettingsForm,
  buildN8nSettingsPayload,
  mapAdminTenantN8nSettingsRow,
  type AdminTenantN8nSettingsForm,
  type AdminTenantN8nSettingsRow,
} from "./admin-tenant-n8n-settings";

export const adminTenantN8nSettingsQueryKey = (tenantId: number) =>
  ["admin", "tenant-n8n-settings", tenantId] as const;

const fetchAdminTenantN8nSettings = async (tenantId: number): Promise<AdminTenantN8nSettingsRow> => {
  const { data, error } = await supabase
    .from("tenant_automation_settings")
    .select(
      "tenant_id, inbound_automation_enabled, n8n_inbound_webhook_url, n8n_last_error, n8n_outbound_webhook_urls, updated_at",
    )
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    return {
      ...mapAdminTenantN8nSettingsRow(null),
      form: buildDefaultAdminTenantN8nSettingsForm(),
    };
  }

  return mapAdminTenantN8nSettingsRow(data as Record<string, unknown>);
};

export const useAdminTenantN8nSettings = (tenantId: number | null) =>
  useQuery({
    enabled: Boolean(tenantId),
    queryFn: () => fetchAdminTenantN8nSettings(tenantId as number),
    queryKey: adminTenantN8nSettingsQueryKey(tenantId as number),
    staleTime: 1000 * 15,
  });

export const useSaveAdminTenantN8nSettings = (tenantId: number | null) => {
  const queryClient = useQueryClient();
  const { currentUnitId } = useCurrentTenant();

  return useMutation({
    mutationFn: async (form: AdminTenantN8nSettingsForm) => {
      if (!tenantId || !currentUnitId) throw new Error("Tenant ou casa inválidos.");

      const payload = buildN8nSettingsPayload(form, tenantId, currentUnitId);

      const { error } = await supabase.from("tenant_automation_settings").upsert(payload, {
        onConflict: "unit_id",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      if (!tenantId) return;
      void queryClient.invalidateQueries({ queryKey: adminTenantN8nSettingsQueryKey(tenantId) });
      void queryClient.invalidateQueries({ queryKey: ["admin", "tenant-config", tenantId] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "tenant-guided-setup", tenantId] });
    },
  });
};
