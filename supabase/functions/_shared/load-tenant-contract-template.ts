import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

import {
  CONTRACT_TEMPLATE_BASE_HTML,
  isContractTemplateKey,
  type ContractTemplateKey,
} from "./contract-template-types.ts";
import {
  parsePackageTemplateMap,
  resolveContractTemplateKeyForPackage,
} from "./resolve-package-contract-template-key.ts";
import { resolveContractTemplateHtml } from "./resolve-contract-template-html.ts";

export interface TenantContractTemplateForGeneration {
  id: number;
  templateHtml: string;
  templateKey: ContractTemplateKey | null;
  version: number;
}

export interface LoadTenantContractTemplateOptions {
  packageId?: number | string | null;
  unitId?: number | null;
}

export const loadTenantContractTemplateForGeneration = async (
  admin: SupabaseClient,
  tenantId: number,
  options?: LoadTenantContractTemplateOptions,
): Promise<TenantContractTemplateForGeneration> => {
  let moduleQuery = admin
    .from("tenant_contract_module_settings")
    .select("default_template_key, template_params")
    .eq("tenant_id", tenantId);

  if (typeof options?.unitId === "number") {
    moduleQuery = moduleQuery.eq("unit_id", options.unitId);
  }

  const { data: moduleSettings, error: moduleSettingsError } = await moduleQuery.maybeSingle();

  if (moduleSettingsError) throw moduleSettingsError;

  const defaultTemplateKey =
    typeof moduleSettings?.default_template_key === "string" &&
    isContractTemplateKey(moduleSettings.default_template_key)
      ? moduleSettings.default_template_key
      : null;

  const rawParams =
    moduleSettings?.template_params && typeof moduleSettings.template_params === "object"
      ? (moduleSettings.template_params as Record<string, unknown>)
      : null;

  const packageTemplateMap = parsePackageTemplateMap(rawParams?.package_template_map);

  const resolvedTemplateKey = resolveContractTemplateKeyForPackage(options?.packageId, {
    defaultTemplateKey,
    packageTemplateMap,
  });

  let templateQuery = admin
    .from("tenant_contract_templates")
    .select("id, template_html, template_key, version")
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  if (typeof options?.unitId === "number") {
    templateQuery = templateQuery.eq("unit_id", options.unitId);
  }

  if (resolvedTemplateKey) {
    templateQuery = templateQuery.eq("template_key", resolvedTemplateKey);
  } else {
    templateQuery = templateQuery.eq("is_default", true);
  }

  const { data: templateRow, error: templateError } = await templateQuery.maybeSingle();

  if (templateError) throw templateError;
  if (!templateRow) {
    throw new Error("Nenhum modelo de contrato padrão encontrado para este espaço.");
  }

  const templateKey =
    typeof templateRow.template_key === "string" && isContractTemplateKey(templateRow.template_key)
      ? templateRow.template_key
      : null;

  const baseHtml = templateKey
    ? CONTRACT_TEMPLATE_BASE_HTML[templateKey]
    : String(templateRow.template_html ?? "");

  return {
    id: Number(templateRow.id),
    templateHtml: resolveContractTemplateHtml(
      typeof templateRow.template_html === "string" ? templateRow.template_html : null,
      baseHtml,
    ),
    templateKey,
    version: Number(templateRow.version ?? 1),
  };
};
