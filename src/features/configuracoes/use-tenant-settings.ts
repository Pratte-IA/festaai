import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

import { configuracoesQueryKeys } from "./query-keys";

export interface MessageTemplate {
  body: string;
  id?: number;
  key: string;
  title: string;
}

export interface FinancialSettings {
  default_down_payment_percentage: number;
  max_installments: number;
}

export const defaultMessageTemplates: MessageTemplate[] = [
  { key: "boas-vindas", title: "Boas Vindas", body: "" },
  { key: "proposta", title: "Proposta", body: "" },
  { key: "confirmacao", title: "Confirmacao", body: "" },
  { key: "pos-festa", title: "Pos-festa", body: "" },
];

export const useTenantMessageTemplates = () => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(currentTenantId),
    queryFn: async (): Promise<MessageTemplate[]> => {
      const { data, error } = await supabase
        .from("tenant_message_templates")
        .select("*")
        .eq("tenant_id", currentTenantId as number)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const rowsByKey = new Map((data ?? []).map((row) => [row.key, row]));

      return defaultMessageTemplates.map((template) => {
        const row = rowsByKey.get(template.key);
        return {
          body: row?.body ?? template.body,
          id: row?.id,
          key: template.key,
          title: row?.title ?? template.title,
        };
      });
    },
    queryKey: configuracoesQueryKeys.messages(currentTenantId),
  });
};

export const useSaveTenantMessageTemplate = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (template: MessageTemplate) => {
      if (!currentTenantId || !user) throw new Error("Sessao ou tenant atual indisponivel.");

      const { error } = await supabase.from("tenant_message_templates").upsert(
        {
          body: template.body,
          key: template.key,
          tenant_id: currentTenantId,
          title: template.title,
          updated_by: user.id,
        },
        { onConflict: "tenant_id,key" },
      );

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: configuracoesQueryKeys.messages(currentTenantId) });
    },
  });
};

export const useTenantFinancialSettings = () => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(currentTenantId),
    queryFn: async (): Promise<FinancialSettings> => {
      const { data, error } = await supabase
        .from("tenant_financial_settings")
        .select("*")
        .eq("tenant_id", currentTenantId as number)
        .maybeSingle();

      if (error) throw error;

      return {
        default_down_payment_percentage: data?.default_down_payment_percentage ?? 30,
        max_installments: data?.max_installments ?? 3,
      };
    },
    queryKey: configuracoesQueryKeys.financial(currentTenantId),
  });
};

export const useSaveTenantFinancialSettings = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (settings: FinancialSettings) => {
      if (!currentTenantId || !user) throw new Error("Sessao ou tenant atual indisponivel.");

      const { error } = await supabase.from("tenant_financial_settings").upsert({
        created_by: user.id,
        default_down_payment_percentage: settings.default_down_payment_percentage,
        max_installments: settings.max_installments,
        tenant_id: currentTenantId,
        updated_by: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: configuracoesQueryKeys.financial(currentTenantId) });
    },
  });
};
