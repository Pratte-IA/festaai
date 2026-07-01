import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

export const BILLING_ACCESS_BLOCK_OVERDUE_HOURS = 48;

const reactivatableStatuses = new Set(["suspended", "past_due"]);

export const suspendTenantForBillingOverdue = async (
  supabase: SupabaseClient,
  tenantId: number,
) => {
  const { data: tenant, error } = await supabase
    .from("tenants")
    .select("id, status")
    .eq("id", tenantId)
    .maybeSingle();

  if (error) throw error;
  if (!tenant || tenant.status === "canceled" || tenant.status === "suspended") {
    return { suspended: false };
  }

  const { error: updateError } = await supabase
    .from("tenants")
    .update({ status: "suspended" })
    .eq("id", tenantId);

  if (updateError) throw updateError;

  return { suspended: true };
};

export const reactivateTenantAfterBillingPayment = async (
  supabase: SupabaseClient,
  tenantId: number,
) => {
  const { data: tenant, error } = await supabase
    .from("tenants")
    .select("id, status")
    .eq("id", tenantId)
    .maybeSingle();

  if (error) throw error;
  if (!tenant || tenant.status === "canceled") {
    return { reactivated: false };
  }

  if (!reactivatableStatuses.has(tenant.status) && tenant.status !== "trialing") {
    return { reactivated: false };
  }

  if (tenant.status === "active") {
    return { reactivated: false };
  }

  const { error: updateError } = await supabase
    .from("tenants")
    .update({ status: "active" })
    .eq("id", tenantId);

  if (updateError) throw updateError;

  return { reactivated: true };
};

export const syncBillingTenantAccessForSubscription = async (
  supabase: SupabaseClient,
  subscription: { tenant_id: number | null },
  overdueHours: number,
) => {
  if (!subscription.tenant_id || overdueHours < BILLING_ACCESS_BLOCK_OVERDUE_HOURS) {
    return { suspended: false };
  }

  return suspendTenantForBillingOverdue(supabase, subscription.tenant_id);
};
