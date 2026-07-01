import { supabase } from "@/lib/supabase/client";

import {
  isContractTemplateKey,
  type ContractTemplateKey,
} from "./contract-template-types";
import {
  isLegacyContractTemplateStub,
  isLegacyPreMigrationContractTemplate,
} from "./resolve-contract-template-html";
import {
  parsePackageTemplateMap,
  resolveContractTemplateKeyForPackage,
} from "./resolve-package-contract-template-key";

export type TenantContractTemplateRow = {
  description: string | null;
  id: number;
  is_active: boolean;
  is_default: boolean;
  name: string;
  template_html: string;
  template_key: string | null;
  version: number;
};

export interface FetchTenantContractTemplateOptions {
  packageId?: number | string | null;
}

export const fetchTenantContractTemplateRow = async (
  tenantId: number,
  options?: FetchTenantContractTemplateOptions,
): Promise<TenantContractTemplateRow | null> => {
  const { data: moduleSettings, error: moduleSettingsError } = await supabase
    .from("tenant_contract_module_settings")
    .select("default_template_key, template_params")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (moduleSettingsError) throw moduleSettingsError;

  const defaultTemplateKey =
    moduleSettings?.default_template_key &&
    isContractTemplateKey(moduleSettings.default_template_key)
      ? (moduleSettings.default_template_key as ContractTemplateKey)
      : null;

  const packageTemplateMap = parsePackageTemplateMap(
    moduleSettings?.template_params &&
      typeof moduleSettings.template_params === "object" &&
      moduleSettings.template_params !== null &&
      "package_template_map" in moduleSettings.template_params
      ? (moduleSettings.template_params as Record<string, unknown>).package_template_map
      : null,
  );

  const resolvedTemplateKey = resolveContractTemplateKeyForPackage(options?.packageId, {
    defaultTemplateKey,
    packageTemplateMap,
  });

  let query = supabase
    .from("tenant_contract_templates")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  if (resolvedTemplateKey) {
    query = query.eq("template_key", resolvedTemplateKey);
  } else {
    query = query.eq("is_default", true);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data as TenantContractTemplateRow | null;
};

export const shouldSeedContractTemplateBaseHtml = (storedHtml: string | null | undefined): boolean =>
  isLegacyContractTemplateStub(storedHtml) || isLegacyPreMigrationContractTemplate(storedHtml);
