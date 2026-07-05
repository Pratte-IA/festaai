import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

import {
  defaultFinancialSettings,
  type FinancialSettings,
} from "./financial-settings-types";
import { configuracoesQueryKeys } from "./query-keys";
import {
  DEFAULT_PROPOSTA_FOLLOWUP_1_DATA_INDISPONIVEL,
  DEFAULT_PROPOSTA_FOLLOWUP_1_DATA_LIVRE,
  DEFAULT_PROPOSTA_FOLLOWUP_2_DATA_INDISPONIVEL,
  DEFAULT_PROPOSTA_FOLLOWUP_2_DATA_LIVRE,
  DEFAULT_PROPOSTA_FOLLOWUP_3_VISITA,
  DEFAULT_PROPOSTA_FOLLOWUP_4_ENCERRAMENTO,
  PROPOSTA_FOLLOWUP_1_TEMPLATE_DATA_INDISPONIVEL,
  PROPOSTA_FOLLOWUP_1_TEMPLATE_DATA_LIVRE,
  PROPOSTA_FOLLOWUP_2_TEMPLATE_DATA_INDISPONIVEL,
  PROPOSTA_FOLLOWUP_2_TEMPLATE_DATA_LIVRE,
  PROPOSTA_FOLLOWUP_3_TEMPLATE_VISITA,
  PROPOSTA_FOLLOWUP_4_TEMPLATE_ENCERRAMENTO,
} from "@/features/eventos/proposta-followup";

export interface MessageTemplate {
  body: string;
  id?: number;
  key: string;
  title: string;
}

export type { FinancialSettings } from "./financial-settings-types";
export {
  defaultFinancialSettings,
  downPaymentMethodLabels,
  installmentLimitModeLabels,
} from "./financial-settings-types";

export const defaultMessageTemplates: MessageTemplate[] = [
  { key: "boas-vindas", title: "Boas Vindas", body: "" },
  { key: "proposta", title: "Proposta", body: "" },
  { key: "confirmacao", title: "Confirmacao", body: "" },
  { key: "pos-festa", title: "Pos-festa", body: "" },
  {
    body: "",
    key: "follow-up-proposta-1-data-livre",
    title: "Follow-up Proposta 1 (data livre)",
  },
  {
    body: "",
    key: "follow-up-proposta-1-data-indisponivel",
    title: "Follow-up Proposta 1 (data indisponivel)",
  },
  {
    body: "",
    key: "follow-up-proposta-2-data-livre",
    title: "Follow-up Proposta 2 (data livre)",
  },
  {
    body: "",
    key: "follow-up-proposta-2-data-indisponivel",
    title: "Follow-up Proposta 2 (data indisponivel)",
  },
  {
    body: "",
    key: "follow-up-proposta-3-visita",
    title: "Follow-up Proposta 3 (convite de visita)",
  },
  {
    body: "",
    key: "follow-up-proposta-4-encerramento",
    title: "Follow-up Proposta 4 (encerramento)",
  },
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
        const defaultBody =
          template.key === PROPOSTA_FOLLOWUP_1_TEMPLATE_DATA_LIVRE
            ? DEFAULT_PROPOSTA_FOLLOWUP_1_DATA_LIVRE
            : template.key === PROPOSTA_FOLLOWUP_1_TEMPLATE_DATA_INDISPONIVEL
              ? DEFAULT_PROPOSTA_FOLLOWUP_1_DATA_INDISPONIVEL
              : template.key === PROPOSTA_FOLLOWUP_2_TEMPLATE_DATA_LIVRE
                ? DEFAULT_PROPOSTA_FOLLOWUP_2_DATA_LIVRE
                : template.key === PROPOSTA_FOLLOWUP_2_TEMPLATE_DATA_INDISPONIVEL
                  ? DEFAULT_PROPOSTA_FOLLOWUP_2_DATA_INDISPONIVEL
                  : template.key === PROPOSTA_FOLLOWUP_3_TEMPLATE_VISITA
                    ? DEFAULT_PROPOSTA_FOLLOWUP_3_VISITA
                    : template.key === PROPOSTA_FOLLOWUP_4_TEMPLATE_ENCERRAMENTO
                      ? DEFAULT_PROPOSTA_FOLLOWUP_4_ENCERRAMENTO
                      : template.body;

        return {
          body: row?.body ?? defaultBody,
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
        ...defaultFinancialSettings,
        cancellation_policy: data?.cancellation_policy ?? null,
        default_down_payment_fixed_value: data?.default_down_payment_fixed_value ?? null,
        default_down_payment_percentage:
          data?.default_down_payment_percentage ?? defaultFinancialSettings.default_down_payment_percentage,
        down_payment_method:
          (data?.down_payment_method as FinancialSettings["down_payment_method"]) ??
          defaultFinancialSettings.down_payment_method,
        down_payment_mode:
          (data?.down_payment_mode as FinancialSettings["down_payment_mode"]) ??
          defaultFinancialSettings.down_payment_mode,
        installment_limit_mode:
          (data?.installment_limit_mode as FinancialSettings["installment_limit_mode"]) ??
          defaultFinancialSettings.installment_limit_mode,
        max_balance_due_days: data?.max_balance_due_days ?? null,
        max_deposit_due_days: data?.max_deposit_due_days ?? null,
        max_installments: data?.max_installments ?? defaultFinancialSettings.max_installments,
        min_deposit_percentage: data?.min_deposit_percentage ?? null,
        remaining_card_installments:
          data?.remaining_card_installments ?? defaultFinancialSettings.remaining_card_installments,
        remaining_due_before_event_enabled:
          data?.remaining_due_before_event_enabled ??
          defaultFinancialSettings.remaining_due_before_event_enabled,
        remaining_due_days_before_event:
          data?.remaining_due_days_before_event ??
          defaultFinancialSettings.remaining_due_days_before_event,
        remaining_pix_installments:
          data?.remaining_pix_installments ?? defaultFinancialSettings.remaining_pix_installments,
        rescheduling_policy: data?.rescheduling_policy ?? null,
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
        cancellation_policy: settings.cancellation_policy?.trim() || null,
        created_by: user.id,
        default_down_payment_fixed_value: settings.default_down_payment_fixed_value,
        default_down_payment_percentage: settings.default_down_payment_percentage,
        down_payment_method: settings.down_payment_method,
        down_payment_mode: settings.down_payment_mode,
        installment_limit_mode: settings.installment_limit_mode,
        max_balance_due_days: settings.max_balance_due_days,
        max_deposit_due_days: settings.max_deposit_due_days,
        max_installments: settings.max_installments,
        min_deposit_percentage: settings.min_deposit_percentage,
        remaining_card_installments: settings.remaining_card_installments,
        remaining_due_before_event_enabled: settings.remaining_due_before_event_enabled,
        remaining_due_days_before_event: settings.remaining_due_days_before_event,
        remaining_pix_installments: settings.remaining_pix_installments,
        rescheduling_policy: settings.rescheduling_policy?.trim() || null,
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
