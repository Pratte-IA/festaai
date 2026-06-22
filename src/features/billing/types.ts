import { Tables } from "@/lib/supabase/database.types";

export type SubscriptionPlan = Tables<"subscription_plans">;
export type BillingCustomer = Tables<"billing_customers">;
export type BillingSubscription = Tables<"billing_subscriptions">;

export interface CheckoutRequest {
  companyName: string;
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
  status: string;
  subscriptionId: number;
}
