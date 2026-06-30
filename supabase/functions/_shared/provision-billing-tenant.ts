import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "festaai-cliente";

const resolveUniqueSlug = async (supabase: SupabaseClient, baseName: string) => {
  const base = slugify(baseName);
  let candidate = base;
  let suffix = 1;

  while (suffix < 100) {
    const { data } = await supabase.from("tenants").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
};

export const provisionBillingTenant = async (
  supabase: SupabaseClient,
  subscriptionId: number,
): Promise<number | null> => {
  const { data: subscription, error } = await supabase
    .from("billing_subscriptions")
    .select(
      "id, tenant_id, customer_id, billing_customers(company_name, email, phone, metadata, name)",
    )
    .eq("id", subscriptionId)
    .maybeSingle();

  if (error) throw error;
  if (!subscription) return null;
  if (subscription.tenant_id) return subscription.tenant_id;

  const customer = Array.isArray(subscription.billing_customers)
    ? subscription.billing_customers[0]
    : subscription.billing_customers;

  if (!customer?.company_name) return null;

  const customerMetadata = (customer.metadata ?? {}) as Record<string, unknown>;
  const slug = await resolveUniqueSlug(supabase, customer.company_name);

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .insert({
      document: customerMetadata.cpf_cnpj ? String(customerMetadata.cpf_cnpj) : null,
      email: customer.email,
      name: customer.company_name,
      phone: customer.phone,
      slug,
      status: "trialing",
    })
    .select("id")
    .single();

  if (tenantError) throw tenantError;

  await supabase.from("billing_subscriptions").update({ tenant_id: tenant.id }).eq("id", subscriptionId);

  if (subscription.customer_id) {
    await supabase
      .from("billing_customers")
      .update({ tenant_id: tenant.id })
      .eq("id", subscription.customer_id);
  }

  return tenant.id;
};
