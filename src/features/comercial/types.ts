import { Tables } from "@/lib/supabase/database.types";

export type CommercialLead = Tables<"commercial_leads">;
export type CommercialOffer = Tables<"commercial_offers">;

export type PublicCommercialOffer = {
  base_plan_slug: string;
  billing_channel: string;
  expires_at: string;
  id: number;
  loyalty_months: number | null;
  monthly_price: number;
  name: string;
  recipient_company: string | null;
  recipient_email: string | null;
  setup_installments: number | null;
  setup_payment_methods: string | null;
  setup_price: number;
  subscription_payment_methods: string | null;
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

export interface AdminContractAcceptanceRow {
  accepted_at: string;
  accepted_by_company: string | null;
  accepted_by_cpf_cnpj: string | null;
  accepted_by_email: string;
  accepted_by_name: string;
  billing_subscription_id: number;
  contract_version: string;
  external_reference: string | null;
  id: number;
  ip_address: string | null;
  subscription_status: string | null;
  tenant_id: number | null;
  tenant_name: string | null;
  user_agent: string | null;
}
