import type { EstruturaBlock } from "@/data/packagesData";
import {
  areAllAutomationBindingsConfigured,
  mergeAutomationTemplateBindings,
  parseAutomationTemplateBindings,
} from "@/features/automations/parse-automation-bindings";
import { supabase } from "@/lib/supabase/client";

import {
  getActiveGuidedSetupStep,
  isGuidedSetupComplete,
  type GuidedSetupStepKey,
} from "./guided-setup-steps";

export interface DerivedGuidedSetupState {
  activeStep: GuidedSetupStepKey | null;
  completedSteps: GuidedSetupStepKey[];
  isComplete: boolean;
}

export const deriveGuidedSetupState = async (tenantId: number): Promise<DerivedGuidedSetupState> => {
  const completed: GuidedSetupStepKey[] = [];

  const [
    profileResult,
    packagesResult,
    additionalsResult,
    estruturaResult,
    financialResult,
    holidaysResult,
    contractSettingsResult,
    contractAcceptanceResult,
    checklistResult,
    whatsappResult,
    automationSettingsResult,
    closingFormResult,
    satisfactionSurveyResult,
  ] = await Promise.all([
    supabase
      .from("tenant_company_profiles")
      .select("completed_at")
      .eq("tenant_id", tenantId)
      .maybeSingle(),
    supabase
      .from("tenant_packages")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
    supabase
      .from("tenant_additionals")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
    supabase
      .from("tenant_estrutura_settings")
      .select("estrutura")
      .eq("tenant_id", tenantId)
      .maybeSingle(),
    supabase
      .from("tenant_financial_settings")
      .select("tenant_id")
      .eq("tenant_id", tenantId)
      .maybeSingle(),
    supabase
      .from("tenant_holidays")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
    supabase
      .from("tenant_contract_module_settings")
      .select("models_configured_at")
      .eq("tenant_id", tenantId)
      .maybeSingle(),
    supabase
      .from("tenant_contract_module_acceptances")
      .select("id")
      .eq("tenant_id", tenantId)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("tenant_checklist_categories")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
    supabase.from("whatsapp_connections").select("status").eq("tenant_id", tenantId),
    supabase
      .from("tenant_automation_settings")
      .select("automation_template_bindings")
      .eq("tenant_id", tenantId)
      .maybeSingle(),
    supabase
      .from("tenant_closing_form_fields")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
    supabase
      .from("tenant_satisfaction_survey_questions")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("active", true),
  ]);

  if (profileResult.error) throw profileResult.error;
  if (packagesResult.error) throw packagesResult.error;
  if (additionalsResult.error) throw additionalsResult.error;
  if (estruturaResult.error && estruturaResult.error.code !== "PGRST205") throw estruturaResult.error;
  if (financialResult.error) throw financialResult.error;
  if (holidaysResult.error) throw holidaysResult.error;
  if (contractSettingsResult.error) throw contractSettingsResult.error;
  if (contractAcceptanceResult.error) throw contractAcceptanceResult.error;
  if (checklistResult.error) throw checklistResult.error;
  if (whatsappResult.error) throw whatsappResult.error;
  if (automationSettingsResult.error) throw automationSettingsResult.error;
  if (closingFormResult.error) throw closingFormResult.error;
  if (satisfactionSurveyResult.error) throw satisfactionSurveyResult.error;

  if (profileResult.data?.completed_at) {
    completed.push("company_profile");
  }

  if ((packagesResult.count ?? 0) > 0) {
    completed.push("packages");
  }

  if ((additionalsResult.count ?? 0) > 0) {
    completed.push("adicionais");
  }

  const estrutura = estruturaResult.data?.estrutura as EstruturaBlock | null | undefined;
  if (Array.isArray(estrutura?.brinquedos) && estrutura.brinquedos.length > 0) {
    completed.push("estrutura");
  }

  if (financialResult.data) {
    completed.push("financeiro");
  }

  if ((holidaysResult.count ?? 0) > 0) {
    completed.push("feriados");
  }

  if (contractSettingsResult.data?.models_configured_at && contractAcceptanceResult.data) {
    completed.push("contrato");
  }

  if ((closingFormResult.count ?? 0) > 0) {
    completed.push("formulario");
  }

  const { data: followupTemplates, error: followupTemplatesError } = await supabase
    .from("tenant_message_templates")
    .select("key")
    .eq("tenant_id", tenantId)
    .in("key", [
      "follow-up-proposta-1-data-livre",
      "follow-up-proposta-1-data-indisponivel",
      "follow-up-proposta-2-data-livre",
      "follow-up-proposta-2-data-indisponivel",
      "follow-up-proposta-3-visita",
      "follow-up-proposta-4-encerramento",
    ]);

  if (followupTemplatesError) throw followupTemplatesError;

  const automationBindings = mergeAutomationTemplateBindings(
    parseAutomationTemplateBindings(automationSettingsResult.data?.automation_template_bindings),
  );
  const followupBindingConfigured = automationBindings.some(
    (binding) => binding.key === "follow-up-proposta" && binding.connectionId !== null,
  );

  if ((followupTemplates?.length ?? 0) > 0 || followupBindingConfigured) {
    completed.push("followup_proposta");
  }

  if ((satisfactionSurveyResult.count ?? 0) > 0) {
    completed.push("pesquisa_avaliacao");
  }

  if ((checklistResult.count ?? 0) > 0) {
    completed.push("checklist");
  }

  // Considera o passo concluído se já houve conexão cadastrada — não só enquanto
  // o status estiver "connected". Assim a queda da sessão não relocka a plataforma
  // nem impede regenerar o QR Code.
  if ((whatsappResult.data?.length ?? 0) > 0) {
    completed.push("whatsapp");
  }

  if (areAllAutomationBindingsConfigured(automationBindings)) {
    completed.push("automacoes");
  }

  return {
    activeStep: getActiveGuidedSetupStep(completed),
    completedSteps: completed,
    isComplete: isGuidedSetupComplete(completed),
  };
};
