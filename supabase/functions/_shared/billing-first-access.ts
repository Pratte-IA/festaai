import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

import { onboardBillingOwner } from "./onboard-billing-owner.ts";
import { provisionBillingTenant } from "./provision-billing-tenant.ts";
import { sendTransactionalEmail } from "./send-transactional-email.ts";

export interface BillingFirstAccessResult {
  emailSent: boolean;
  onboarded: boolean;
  setupPasswordUrl: string | null;
  tenantId: number | null;
}

const extractCpf = (metadata: Record<string, unknown>) => {
  const raw = String(metadata.cpf_cnpj ?? metadata.cpf ?? "").replace(/\D/g, "");
  return raw.length === 11 ? raw : null;
};

export const completeBillingFirstAccess = async (
  supabase: SupabaseClient,
  supabaseUrl: string,
  serviceRoleKey: string,
  subscriptionId: number,
  options: { forceResend?: boolean } = {},
): Promise<BillingFirstAccessResult> => {
  const { data: subscription, error } = await supabase
    .from("billing_subscriptions")
    .select(
      "id, tenant_id, metadata, billing_customers(email, name, metadata), subscription_plans(name)",
    )
    .eq("id", subscriptionId)
    .maybeSingle();

  if (error) throw error;
  if (!subscription) {
    return { emailSent: false, onboarded: false, setupPasswordUrl: null, tenantId: null };
  }

  const metadata = (subscription.metadata ?? {}) as Record<string, unknown>;
  if (metadata.first_access_email_sent_at && !options.forceResend) {
    return {
      emailSent: false,
      onboarded: false,
      setupPasswordUrl: null,
      tenantId: subscription.tenant_id,
    };
  }

  let tenantId = subscription.tenant_id;
  if (!tenantId) {
    tenantId = await provisionBillingTenant(supabase, subscriptionId);
  }

  if (!tenantId) {
    return { emailSent: false, onboarded: false, setupPasswordUrl: null, tenantId: null };
  }

  const customer = Array.isArray(subscription.billing_customers)
    ? subscription.billing_customers[0]
    : subscription.billing_customers;
  const plan = Array.isArray(subscription.subscription_plans)
    ? subscription.subscription_plans[0]
    : subscription.subscription_plans;

  if (!customer?.email) {
    return { emailSent: false, onboarded: false, setupPasswordUrl: null, tenantId };
  }

  const customerMetadata = (customer.metadata ?? {}) as Record<string, unknown>;
  const requesterName = String(customerMetadata.requester_name ?? customer.name ?? "Cliente FestaAI");

  const onboardResult = await onboardBillingOwner(supabase, {
    cpf: extractCpf(customerMetadata),
    email: customer.email,
    fullName: requesterName,
    tenantId,
  });

  await sendTransactionalEmail(supabaseUrl, serviceRoleKey, {
    metadata: {
      billing_subscription_id: subscriptionId,
      trigger: "billing_first_access",
    },
    params: {
      ctaLabel: "Criar minha senha e acessar",
      ctaUrl: onboardResult.setupPasswordUrl,
      name: requesterName,
      planName: plan?.name ?? "FestaAI",
      setupPasswordUrl: onboardResult.setupPasswordUrl,
    },
    recipient: {
      email: customer.email,
      name: requesterName,
    },
    templateKey: "billing_payment_confirmed",
    tenantId,
  });

  await supabase
    .from("billing_subscriptions")
    .update({
      metadata: {
        ...metadata,
        first_access_email_sent_at: new Date().toISOString(),
        owner_user_id: onboardResult.userId,
      },
    })
    .eq("id", subscriptionId);

  return {
    emailSent: true,
    onboarded: true,
    setupPasswordUrl: onboardResult.setupPasswordUrl,
    tenantId,
  };
};
