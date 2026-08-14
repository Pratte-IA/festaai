import { useQuery } from "@tanstack/react-query";

import {
  mergeAutomationTemplateBindings,
  parseAutomationTemplateBindings,
} from "@/features/automations/parse-automation-bindings";
import { parseOutboundWebhookUrls } from "@/features/admin/admin-tenant-n8n-settings";
import { parseTenantContractTemplateParams } from "@/features/eventos/contracts/contract-template-params";
import type { GuidedSetupStepKey } from "@/features/guided-setup";
import { collapsePricingTiersToAnchors } from "@/data/expand-pricing-tiers";
import { supabase } from "@/lib/supabase/client";

export const adminTenantConfigSectionQueryKey = (tenantId: number, section: GuidedSetupStepKey) =>
  ["admin", "tenant-config", tenantId, section] as const;

const fetchSectionData = async (tenantId: number, section: GuidedSetupStepKey) => {
  switch (section) {
    case "company_profile": {
      const { data, error } = await supabase
        .from("tenant_company_profiles")
        .select("*")
        .eq("tenant_id", tenantId)
        .maybeSingle();
      if (error) throw error;
      return data;
    }
    case "packages": {
      const { data, error } = await supabase
        .from("tenant_packages")
        .select(
          "id, name, name_automacao, description, active, duration_minutes, included_guests, pricing_tiers, buffet, equipe, included_items, excluded_items, rules, sort_order",
        )
        .eq("tenant_id", tenantId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row) => {
        const { tiers } = normalizePackagePricing(row.pricing_tiers);
        const anchorTiers = collapsePricingTiersToAnchors(tiers);
        return {
          ...row,
          buffet: normalizeBuffetBlock(row.buffet),
          equipe: normalizeEquipe(row.equipe, anchorTiers.map((tier) => tier.id)),
          includedItems: parsePackageItems(row.included_items),
          excludedItems: parsePackageItems(row.excluded_items),
          pricingTiers: anchorTiers,
        };
      });
    }
    case "adicionais": {
      const { data, error } = await supabase
        .from("tenant_additionals")
        .select("id, name, category, type, price, description, active, is_required, package_ids, sort_order")
        .eq("tenant_id", tenantId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    }
    case "estrutura": {
      const { data, error } = await supabase
        .from("tenant_estrutura_settings")
        .select("estrutura")
        .eq("tenant_id", tenantId)
        .maybeSingle();
      if (error && error.code !== "PGRST205") throw error;
      return data?.estrutura ?? null;
    }
    case "financeiro": {
      const { data, error } = await supabase
        .from("tenant_financial_settings")
        .select("*")
        .eq("tenant_id", tenantId)
        .maybeSingle();
      if (error) throw error;
      return data;
    }
    case "feriados": {
      const { data, error } = await supabase
        .from("tenant_holidays")
        .select("id, holiday_date, name, scope, kind, recurs_annually, active")
        .eq("tenant_id", tenantId)
        .order("holiday_date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    }
    case "checklist": {
      const [categoriesResult, itemsResult] = await Promise.all([
        supabase
          .from("tenant_checklist_categories")
          .select("id, name, sort_order")
          .eq("tenant_id", tenantId)
          .order("sort_order", { ascending: true }),
        supabase
          .from("tenant_checklist_items")
          .select("id, category_id, label, sort_order, package_id")
          .eq("tenant_id", tenantId)
          .order("sort_order", { ascending: true }),
      ]);
      if (categoriesResult.error) throw categoriesResult.error;
      if (itemsResult.error) throw itemsResult.error;
      return {
        categories: categoriesResult.data ?? [],
        items: itemsResult.data ?? [],
      };
    }
    case "contrato": {
      const [settingsResult, acceptancesResult, templatesResult, packagesResult] = await Promise.all([
        supabase
          .from("tenant_contract_module_settings")
          .select("tenant_id, models_configured_at, default_template_key, template_params, updated_at")
          .eq("tenant_id", tenantId)
          .maybeSingle(),
        supabase
          .from("tenant_contract_module_acceptances")
          .select("id, accepted_at, accepted_by_name, terms_version")
          .eq("tenant_id", tenantId)
          .order("accepted_at", { ascending: false }),
        supabase
          .from("tenant_contract_templates")
          .select("id, name, template_key, is_active, is_default, updated_at")
          .eq("tenant_id", tenantId)
          .order("name", { ascending: true }),
        supabase
          .from("tenant_packages")
          .select("id, name")
          .eq("tenant_id", tenantId)
          .order("sort_order", { ascending: true }),
      ]);
      if (settingsResult.error) throw settingsResult.error;
      if (acceptancesResult.error) throw acceptancesResult.error;
      if (templatesResult.error) throw templatesResult.error;
      if (packagesResult.error) throw packagesResult.error;
      return {
        acceptances: acceptancesResult.data ?? [],
        packages: packagesResult.data ?? [],
        settings: settingsResult.data
          ? {
              ...settingsResult.data,
              templateParams: parseTenantContractTemplateParams(settingsResult.data.template_params),
            }
          : null,
        templates: templatesResult.data ?? [],
      };
    }
    case "formulario": {
      const { data, error } = await supabase
        .from("tenant_closing_form_fields")
        .select("id, field_key, label, field_type, required, sort_order, active, section_key")
        .eq("tenant_id", tenantId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    }
    case "followup_proposta": {
      const { data, error } = await supabase
        .from("tenant_message_templates")
        .select("key, title, body")
        .eq("tenant_id", tenantId)
        .like("key", "follow-up-proposta%")
        .order("key", { ascending: true });
      if (error) throw error;
      return data ?? [];
    }
    case "pesquisa_avaliacao": {
      const { data, error } = await supabase
        .from("tenant_satisfaction_survey_questions")
        .select("id, question_key, label, question_type, required, active, sort_order")
        .eq("tenant_id", tenantId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    }
    case "whatsapp": {
      const { data, error } = await supabase
        .from("whatsapp_connections")
        .select("id, name, instance_name, phone, status, created_at, updated_at")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    }
    case "automacoes": {
      const [settingsResult, connectionsResult] = await Promise.all([
        supabase.from("tenant_automation_settings").select("*").eq("tenant_id", tenantId).maybeSingle(),
        supabase
          .from("whatsapp_connections")
          .select("id, name, phone, status")
          .eq("tenant_id", tenantId),
      ]);
      if (settingsResult.error) throw settingsResult.error;
      if (connectionsResult.error) throw connectionsResult.error;

      const bindings = mergeAutomationTemplateBindings(
        parseAutomationTemplateBindings(settingsResult.data?.automation_template_bindings),
      );
      const outboundWebhookUrls = parseOutboundWebhookUrls(settingsResult.data?.n8n_outbound_webhook_urls);

      return {
        bindings,
        connections: connectionsResult.data ?? [],
        inboundAutomationEnabled: settingsResult.data?.inbound_automation_enabled === true,
        inboundWebhookUrl:
          typeof settingsResult.data?.n8n_inbound_webhook_url === "string"
            ? settingsResult.data.n8n_inbound_webhook_url
            : null,
        outboundWebhookUrls,
      };
    }
    default:
      return null;
  }
};

export const useAdminTenantConfigSection = (
  tenantId: number | null,
  section: GuidedSetupStepKey | null,
) =>
  useQuery({
    enabled: Boolean(tenantId && section),
    queryFn: () => fetchSectionData(tenantId as number, section as GuidedSetupStepKey),
    queryKey: adminTenantConfigSectionQueryKey(tenantId as number, section as GuidedSetupStepKey),
    staleTime: 1000 * 30,
  });
