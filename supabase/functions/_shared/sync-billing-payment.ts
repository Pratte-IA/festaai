import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

import { AsaasPayment, fetchPayment, resolvePaymentCheckoutUrl } from "./asaas-client.ts";

interface SyncBillingPaymentInput {
  payment: AsaasPayment;
  paymentKind: "setup" | "subscription";
}

export const syncBillingSubscriptionPayment = async (
  supabase: SupabaseClient,
  subscriptionId: number,
  metadata: Record<string, unknown>,
  input: SyncBillingPaymentInput,
) => {
  const checkoutUrl = resolvePaymentCheckoutUrl(input.payment);
  const paymentMetadata =
    input.paymentKind === "setup"
      ? {
          setup_provider_payment_id: input.payment.id,
        }
      : {
          subscription_provider_payment_id: input.payment.id,
        };

  const { error } = await supabase
    .from("billing_subscriptions")
    .update({
      checkout_url: checkoutUrl,
      ...(input.payment.dueDate ? { next_due_date: input.payment.dueDate } : {}),
      metadata: {
        ...metadata,
        ...paymentMetadata,
      },
    })
    .eq("id", subscriptionId);

  if (error) throw error;

  return checkoutUrl;
};

export const loadBillingSubscriptionCustomer = async (
  supabase: SupabaseClient,
  subscriptionId: number,
) => {
  const { data, error } = await supabase
    .from("billing_subscriptions")
    .select("id, tenant_id, metadata, billing_customers(email, name)")
    .eq("id", subscriptionId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const customer = Array.isArray(data.billing_customers)
    ? data.billing_customers[0]
    : data.billing_customers;

  return {
    customer,
    metadata: (data.metadata ?? {}) as Record<string, unknown>,
    subscriptionId: data.id,
    tenantId: data.tenant_id,
  };
};

export const refreshBillingPayment = async (paymentId: string) => fetchPayment(paymentId);
