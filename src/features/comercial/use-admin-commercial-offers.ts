import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
import { findCommercialConditionBySlug } from "@/pages/contratar-commercial-data";
import { TablesInsert, TablesUpdate } from "@/lib/supabase/database.types";
import { supabase } from "@/lib/supabase/client";

import {
  BasePlanSlug,
  CommercialOfferStatus,
  DEFAULT_OFFER_VALIDITY_DAYS,
  defaultOfferExpiresAt,
  generateOfferToken,
} from "./constants";
import { comercialQueryKeys } from "./query-keys";
import { CommercialOffer } from "./types";

export type CommercialOfferInput = {
  basePlanSlug: BasePlanSlug;
  expiresAt: string;
  leadId?: number | null;
  loyaltyMonths: number | null;
  monthlyPrice: number;
  name: string;
  recipientCompany: string;
  recipientEmail: string;
  setupInstallments: number | null;
  setupPrice: number;
  status: CommercialOfferStatus;
  token: string;
};

const mapOfferInput = (input: CommercialOfferInput, userId: string): TablesInsert<"commercial_offers"> => ({
  base_plan_slug: input.basePlanSlug,
  created_by: userId,
  expires_at: input.expiresAt,
  lead_id: input.leadId ?? null,
  loyalty_months: input.loyaltyMonths,
  monthly_price: input.monthlyPrice,
  name: input.name,
  recipient_company: input.recipientCompany || null,
  recipient_email: input.recipientEmail || null,
  setup_installments: input.setupInstallments,
  setup_price: input.setupPrice,
  status: input.status,
  token: input.token,
});

export const buildDefaultOfferFromPlan = (
  basePlanSlug: BasePlanSlug,
  overrides?: Partial<CommercialOfferInput>,
): CommercialOfferInput => {
  const plan = findCommercialConditionBySlug(basePlanSlug);
  const setupInstallments =
    basePlanSlug === "avista" ? 1 : basePlanSlug === "fidelidade" || basePlanSlug === "parcelado" ? 6 : null;

  return {
    basePlanSlug,
    expiresAt: defaultOfferExpiresAt(),
    leadId: null,
    loyaltyMonths: basePlanSlug === "fidelidade" ? 12 : null,
    monthlyPrice: plan?.monthly_price ?? 750,
    name: overrides?.recipientCompany
      ? `Proposta ${overrides.recipientCompany}`
      : `Proposta ${plan?.name ?? basePlanSlug}`,
    recipientCompany: "",
    recipientEmail: "",
    setupInstallments,
    setupPrice:
      basePlanSlug === "avista" ? 2200 : basePlanSlug === "fidelidade" ? 2000 : basePlanSlug === "parcelado" ? 2500 : 0,
    status: "draft",
    token: generateOfferToken(overrides?.recipientCompany),
    ...overrides,
  };
};

export const useAdminCommercialOffers = (statusFilter = "all") =>
  useQuery({
    queryFn: async () => {
      let query = supabase.from("commercial_offers").select("*").order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as CommercialOffer[];
    },
    queryKey: comercialQueryKeys.adminOffers(statusFilter),
  });

export const useAdminCommercialOffer = (id: number | null) =>
  useQuery({
    enabled: id != null,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commercial_offers")
        .select("*")
        .eq("id", id as number)
        .maybeSingle();

      if (error) throw error;
      return data as CommercialOffer | null;
    },
    queryKey: comercialQueryKeys.adminOffer(id),
  });

export const useAdminSaveCommercialOffer = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, values }: { id?: number | null; values: CommercialOfferInput }) => {
      if (!user?.id) throw new Error("Sessão inválida.");

      const payload = mapOfferInput(values, user.id);

      if (id) {
        const updatePayload: TablesUpdate<"commercial_offers"> = payload;
        const { error } = await supabase.from("commercial_offers").update(updatePayload).eq("id", id);
        if (error) throw error;
        return id;
      }

      const { data, error } = await supabase.from("commercial_offers").insert(payload).select("id").single();
      if (error) throw error;
      return data.id as number;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "comercial", "offers"] });
    },
  });
};

export const useAdminUpdateCommercialOfferStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: CommercialOfferStatus }) => {
      const { error } = await supabase.from("commercial_offers").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "comercial", "offers"] });
    },
  });
};

export { DEFAULT_OFFER_VALIDITY_DAYS, generateOfferToken, defaultOfferExpiresAt };
