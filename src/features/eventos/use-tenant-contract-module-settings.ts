import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

import {
  CONTRACT_TEMPLATE_DEFINITIONS,
  CONTRACT_TEMPLATE_KEYS,
  type ContractTemplateKey,
} from "./contracts/contract-template-types";
import {
  parseTenantContractTemplateParams,
  type TenantContractTemplateParams,
} from "./contracts/contract-template-params";
import { eventosQueryKeys } from "./query-keys";
import { useIsContractModuleEnabled } from "./use-tenant-contract-module-acceptance";

type ModuleSettingsRow = {
  default_template_key: string | null;
  models_configured_at: string | null;
  template_params: unknown;
  tenant_id: number;
  updated_at: string;
};

type TemplateRow = {
  id: number;
  is_active: boolean;
  is_default: boolean;
  template_key: string;
};

export interface TenantContractModuleSettings {
  defaultTemplateKey: ContractTemplateKey | null;
  modelsConfiguredAt: string | null;
  templateParams: TenantContractTemplateParams;
  tenantId: number;
  updatedAt: string;
}

export interface TenantContractTypeOption {
  definition: (typeof CONTRACT_TEMPLATE_DEFINITIONS)[ContractTemplateKey];
  enabled: boolean;
  id: string | null;
  isDefault: boolean;
  key: ContractTemplateKey;
}

const mapSettingsRow = (row: ModuleSettingsRow): TenantContractModuleSettings => ({
  defaultTemplateKey:
    row.default_template_key &&
    CONTRACT_TEMPLATE_KEYS.includes(row.default_template_key as ContractTemplateKey)
      ? (row.default_template_key as ContractTemplateKey)
      : null,
  modelsConfiguredAt: row.models_configured_at,
  templateParams: parseTenantContractTemplateParams(row.template_params),
  tenantId: row.tenant_id,
  updatedAt: row.updated_at,
});

export const useTenantContractModuleSettings = () => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(currentTenantId),
    queryFn: async (): Promise<TenantContractModuleSettings | null> => {
      const { data, error } = await supabase
        .from("tenant_contract_module_settings")
        .select("tenant_id, models_configured_at, default_template_key, template_params, updated_at")
        .eq("tenant_id", currentTenantId as number)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return mapSettingsRow(data as ModuleSettingsRow);
    },
    queryKey: eventosQueryKeys.contractModuleSettings(currentTenantId),
  });
};

export const useTenantContractTypeOptions = () => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(currentTenantId),
    queryFn: async (): Promise<TenantContractTypeOption[]> => {
      const { data, error } = await supabase
        .from("tenant_contract_templates")
        .select("id, template_key, is_active, is_default")
        .eq("tenant_id", currentTenantId as number)
        .in("template_key", [...CONTRACT_TEMPLATE_KEYS]);

      if (error) throw error;

      const rows = (data ?? []) as TemplateRow[];

      return CONTRACT_TEMPLATE_KEYS.map((key) => {
        const row = rows.find((item) => item.template_key === key);

        return {
          definition: CONTRACT_TEMPLATE_DEFINITIONS[key],
          enabled: row?.is_active ?? false,
          id: row ? String(row.id) : null,
          isDefault: row?.is_default ?? false,
          key,
        };
      }).sort((a, b) => a.definition.sortOrder - b.definition.sortOrder);
    },
    queryKey: eventosQueryKeys.contractTypeTemplates(currentTenantId),
  });
};

export const useIsContractModuleModelsConfigured = () => {
  const query = useTenantContractModuleSettings();

  return {
    ...query,
    isConfigured: Boolean(query.data?.modelsConfiguredAt && query.data.defaultTemplateKey),
  };
};

export const useNeedsContractModelsReview = () => {
  const settingsQuery = useTenantContractModuleSettings();
  const optionsQuery = useTenantContractTypeOptions();

  const enabledOptions = (optionsQuery.data ?? []).filter((option) => option.enabled);
  const needsReview =
    enabledOptions.length > 0 && !settingsQuery.data?.modelsConfiguredAt;

  return {
    enabledOptions,
    error: settingsQuery.error ?? optionsQuery.error,
    isLoading: settingsQuery.isLoading || optionsQuery.isLoading,
    needsReview,
  };
};

export const useIsContractModuleReady = () => {
  const modelsQuery = useIsContractModuleModelsConfigured();
  const termsQuery = useIsContractModuleEnabled();

  const isLoading = modelsQuery.isLoading || termsQuery.isLoading;
  const error = modelsQuery.error ?? termsQuery.error;

  return {
    error,
    isEnabled: modelsQuery.isConfigured && termsQuery.isEnabled,
    isLoading,
    isModelsConfigured: modelsQuery.isConfigured,
    isTermsAccepted: termsQuery.isEnabled,
  };
};

interface SaveContractModuleModelsInput {
  enabledKeys: ContractTemplateKey[];
}

const resolveDefaultTemplateKey = (enabledKeys: ContractTemplateKey[]): ContractTemplateKey => {
  if (enabledKeys.includes("aluguel_espaco_festa_completa")) {
    return "aluguel_espaco_festa_completa";
  }

  return enabledKeys[0];
};

export const useSaveContractModuleModels = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: SaveContractModuleModelsInput) => {
      if (!currentTenantId || !user) {
        throw new Error("Sessão ou tenant atual indisponível.");
      }

      if (input.enabledKeys.length === 0) {
        throw new Error("Selecione ao menos um tipo de contrato para continuar.");
      }

      const defaultTemplateKey = resolveDefaultTemplateKey(input.enabledKeys);

      for (const key of CONTRACT_TEMPLATE_KEYS) {
        const enabled = input.enabledKeys.includes(key);
        const definition = CONTRACT_TEMPLATE_DEFINITIONS[key];

        const { data: existing, error: existingError } = await supabase
          .from("tenant_contract_templates")
          .select("id")
          .eq("tenant_id", currentTenantId)
          .eq("template_key", key)
          .maybeSingle();

        if (existingError) throw existingError;

        if (existing) {
          const { error: updateError } = await supabase
            .from("tenant_contract_templates")
            .update({
              description: definition.description,
              is_active: enabled,
              is_default: enabled && key === defaultTemplateKey,
              name: definition.name,
              template_html: definition.placeholderHtml,
              updated_by: user.id,
            })
            .eq("tenant_id", currentTenantId)
            .eq("id", existing.id);

          if (updateError) throw updateError;
          continue;
        }

        const { error: insertError } = await supabase.from("tenant_contract_templates").insert({
          description: definition.description,
          is_active: enabled,
          is_default: enabled && key === defaultTemplateKey,
          name: definition.name,
          template_html: definition.placeholderHtml,
          template_key: key,
          tenant_id: currentTenantId,
          updated_by: user.id,
          version: 1,
        });

        if (insertError) throw insertError;
      }

      const { data: settings, error: settingsError } = await supabase
        .from("tenant_contract_module_settings")
        .upsert(
          {
            default_template_key: defaultTemplateKey,
            tenant_id: currentTenantId,
            updated_by: user.id,
          },
          { onConflict: "tenant_id" },
        )
        .select("tenant_id, models_configured_at, default_template_key, template_params, updated_at")
        .single();

      if (settingsError) throw settingsError;

      return mapSettingsRow(settings as ModuleSettingsRow);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: eventosQueryKeys.contractModuleSettings(currentTenantId),
      });
      void queryClient.invalidateQueries({
        queryKey: eventosQueryKeys.contractTypeTemplates(currentTenantId),
      });
      void queryClient.invalidateQueries({
        queryKey: eventosQueryKeys.contractTemplate(currentTenantId),
      });
    },
  });
};

interface CompleteContractModelsReviewInput {
  params: TenantContractTemplateParams;
}

export const useCompleteContractModelsReview = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CompleteContractModelsReviewInput) => {
      if (!currentTenantId || !user) {
        throw new Error("Sessão ou tenant atual indisponível.");
      }

      const now = new Date().toISOString();

      const { data: settings, error: settingsError } = await supabase
        .from("tenant_contract_module_settings")
        .upsert(
          {
            models_configured_at: now,
            template_params: input.params,
            tenant_id: currentTenantId,
            updated_by: user.id,
          },
          { onConflict: "tenant_id" },
        )
        .select("tenant_id, models_configured_at, default_template_key, template_params, updated_at")
        .single();

      if (settingsError) throw settingsError;

      return mapSettingsRow(settings as ModuleSettingsRow);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: eventosQueryKeys.contractModuleSettings(currentTenantId),
      });
      void queryClient.invalidateQueries({
        queryKey: eventosQueryKeys.contractTypeTemplates(currentTenantId),
      });
    },
  });
};

export const useRestartContractModuleSetup = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!currentTenantId || !user) {
        throw new Error("Sessão ou tenant atual indisponível.");
      }

      for (const key of CONTRACT_TEMPLATE_KEYS) {
        const { error: templateError } = await supabase
          .from("tenant_contract_templates")
          .update({
            is_active: false,
            is_default: false,
            updated_by: user.id,
          })
          .eq("tenant_id", currentTenantId)
          .eq("template_key", key);

        if (templateError) throw templateError;
      }

      const { error: settingsError } = await supabase
        .from("tenant_contract_module_settings")
        .upsert(
          {
            default_template_key: null,
            models_configured_at: null,
            template_params: {},
            tenant_id: currentTenantId,
            updated_by: user.id,
          },
          { onConflict: "tenant_id" },
        );

      if (settingsError) throw settingsError;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: eventosQueryKeys.contractModuleSettings(currentTenantId),
      });
      void queryClient.invalidateQueries({
        queryKey: eventosQueryKeys.contractTypeTemplates(currentTenantId),
      });
      void queryClient.invalidateQueries({
        queryKey: eventosQueryKeys.contractTemplate(currentTenantId),
      });
    },
  });
};
