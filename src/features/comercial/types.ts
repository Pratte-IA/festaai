import { Tables } from "@/lib/supabase/database.types";

export type CommercialLead = Tables<"commercial_leads">;
export type CommercialOffer = Tables<"commercial_offers">;

export type PublicCommercialOffer = {
  base_plan_slug: string;
  expires_at: string;
  id: number;
  loyalty_months: number | null;
  monthly_price: number;
  name: string;
  recipient_company: string | null;
  recipient_email: string | null;
  setup_installments: number | null;
  setup_price: number;
  token: string;
};

export interface SubmitCommercialLeadRequest {
  companyName: string;
  email: string;
  message?: string;
  name: string;
  phone: string;
}

export interface AdminBillingSubscriptionRow {
  checkout_url: string | null;
  company_name: string | null;
  created_at: string;
  customer_email: string;
  customer_name: string;
  id: number;
  metadata: Record<string, unknown>;
  plan_name: string | null;
  status: string;
  tenant_id: number | null;
  tenant_name: string | null;
}
