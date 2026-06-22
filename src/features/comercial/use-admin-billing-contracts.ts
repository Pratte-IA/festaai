import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase/client";

import { comercialQueryKeys } from "./query-keys";
import { AdminBillingSubscriptionRow } from "./types";

export const useAdminBillingContracts = () =>
  useQuery({
    queryFn: async () => {
      const { data, error } = await supabase
        .from("billing_subscriptions")
        .select(
          `
          id,
          status,
          checkout_url,
          created_at,
          tenant_id,
          metadata,
          billing_customers ( name, email, company_name ),
          subscription_plans ( name ),
          tenants ( name )
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data ?? []).map((row) => {
        const customer = Array.isArray(row.billing_customers)
          ? row.billing_customers[0]
          : row.billing_customers;
        const plan = Array.isArray(row.subscription_plans)
          ? row.subscription_plans[0]
          : row.subscription_plans;
        const tenant = Array.isArray(row.tenants) ? row.tenants[0] : row.tenants;

        return {
          checkout_url: row.checkout_url,
          company_name: customer?.company_name ?? null,
          created_at: row.created_at,
          customer_email: customer?.email ?? "",
          customer_name: customer?.name ?? "",
          id: row.id,
          metadata: (row.metadata ?? {}) as Record<string, unknown>,
          plan_name: plan?.name ?? null,
          status: row.status,
          tenant_id: row.tenant_id,
          tenant_name: tenant?.name ?? null,
        } satisfies AdminBillingSubscriptionRow;
      });
    },
    queryKey: comercialQueryKeys.adminContracts(),
  });

export const useAdminTenantBilling = (tenantId: number | null) =>
  useQuery({
    enabled: tenantId != null && tenantId > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("billing_subscriptions")
        .select(
          `
          id,
          status,
          checkout_url,
          created_at,
          next_due_date,
          metadata,
          billing_customers ( name, email, company_name ),
          subscription_plans ( name, monthly_price )
        `,
        )
        .eq("tenant_id", tenantId as number)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    queryKey: comercialQueryKeys.tenantBilling(tenantId ?? 0),
  });
