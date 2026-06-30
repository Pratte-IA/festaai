import { Tables } from "@/lib/supabase/database.types";

export type SubscriptionPlan = Tables<"subscription_plans">;
export type BillingCustomer = Tables<"billing_customers">;
export type BillingSubscription = Tables<"billing_subscriptions">;

export interface CheckoutRequest {
  companyName: string;
  cpfCnpj: string;
  email: string;
  message?: string;
  name: string;
  offerToken?: string | null;
  phone: string;
  planSlug: string;
  tenantId?: number | null;
}

export interface CheckoutResponse {
  checkoutUrl: string | null;
  externalReference: string;
  maxSetupInstallments: number;
  monthlyPrice: number;
  planName: string;
  setupPrice: number;
  status: string;
  subscriptionId: number;
}

export interface CreateSetupPaymentRequest {
  externalReference: string;
  setupInstallments: number;
}

export interface CreateSetupPaymentResponse {
  checkoutUrl: string | null;
  setupInstallments: number;
  setupInstallmentValue: number;
  setupPrice: number;
}

export interface PublicCheckoutStatus {
  checkoutUrl: string | null;
  externalReference: string;
  maxSetupInstallments: number;
  monthlyPrice: number | null;
  planName: string | null;
  selectedSetupInstallments: number | null;
  setupInstallmentValue: number | null;
  setupPaymentMethods: string | null;
  setupPrice: number | null;
  status: string;
  subscriptionCommitmentTotal: number | null;
  subscriptionMaxPayments: number | null;
  subscriptionPaymentMethods: string | null;
}
