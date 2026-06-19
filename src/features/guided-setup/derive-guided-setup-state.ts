import type { EstruturaBlock } from "@/data/packagesData";
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
    contractSettingsResult,
    contractAcceptanceResult,
    checklistResult,
    whatsappResult,
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
  ]);

  if (profileResult.error) throw profileResult.error;
  if (packagesResult.error) throw packagesResult.error;
  if (additionalsResult.error) throw additionalsResult.error;
  if (estruturaResult.error && estruturaResult.error.code !== "PGRST205") throw estruturaResult.error;
  if (financialResult.error) throw financialResult.error;
  if (contractSettingsResult.error) throw contractSettingsResult.error;
  if (contractAcceptanceResult.error) throw contractAcceptanceResult.error;
  if (checklistResult.error) throw checklistResult.error;
  if (whatsappResult.error) throw whatsappResult.error;

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

  if (contractSettingsResult.data?.models_configured_at && contractAcceptanceResult.data) {
    completed.push("contrato");
  }

  if ((checklistResult.count ?? 0) > 0) {
    completed.push("checklist");
  }

  if (whatsappResult.data?.some((connection) => connection.status === "connected")) {
    completed.push("whatsapp");
  }

  return {
    activeStep: getActiveGuidedSetupStep(completed),
    completedSteps: completed,
    isComplete: isGuidedSetupComplete(completed),
  };
};
