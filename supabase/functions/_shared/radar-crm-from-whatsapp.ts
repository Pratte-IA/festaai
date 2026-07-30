import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

import { formatBrazilPhone, toWhatsAppMePhone, toWhatsAppPhoneKey } from "./phone.ts";
import { buildPhoneLookupVariants } from "./phone-lookup.ts";

/** Move new_lead/qualifying → contact_started para um company_id conhecido do CRM. */
export const markCrmContactStarted = async (
  service: SupabaseClient,
  companyId: number,
) => {
  const { data, error } = await service.rpc("radar_crm_mark_contact_started", {
    p_company_id: companyId,
  });
  if (error) throw error;
  return data as {
    companyId: number;
    crmStatus: string;
    moved: boolean;
    ok: boolean;
    previousStatus: string;
  };
};

/** Cria/atualiza card no CRM a partir do telefone da Evolution (inbound plataforma). */
export const ensureCrmLeadFromPlatformWhatsapp = async (
  service: SupabaseClient,
  input: {
    customerName: string | null;
    customerPhone: string;
    radarCompanyId?: number | null;
  },
) => {
  if (input.radarCompanyId != null && Number.isFinite(input.radarCompanyId)) {
    const marked = await markCrmContactStarted(service, input.radarCompanyId);
    return {
      ok: true as const,
      result: {
        companyId: marked.companyId,
        created: false,
        crmStatus: marked.crmStatus,
        moved: marked.moved,
        ok: true,
        previousStatus: marked.previousStatus,
      },
    };
  }

  const canonicalPhone = toWhatsAppPhoneKey(input.customerPhone) ?? toWhatsAppMePhone(input.customerPhone);
  if (!canonicalPhone) {
    return { ok: false as const, reason: "invalid_phone" as const };
  }

  const displayPhone =
    formatBrazilPhone(input.customerPhone) ||
    toWhatsAppMePhone(input.customerPhone) ||
    canonicalPhone;

  const { data, error } = await service.rpc("radar_crm_ensure_lead_from_whatsapp", {
    p_canonical_phone: canonicalPhone,
    p_customer_name: input.customerName?.trim() || null,
    p_display_phone: displayPhone,
    p_phone_candidates: buildPhoneLookupVariants(input.customerPhone),
  });

  if (error) throw error;

  return {
    ok: true as const,
    result: data as {
      companyId: number;
      created: boolean;
      crmStatus: string;
      moved?: boolean;
      ok: boolean;
      previousStatus?: string;
    },
  };
};
