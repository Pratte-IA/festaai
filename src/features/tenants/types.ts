import { Tables } from "@/lib/supabase/database.types";

export type TenantStatus = "active" | "trialing" | "past_due" | "suspended" | "canceled";

export type Tenant = Omit<Tables<"tenants">, "status"> & {
  status: TenantStatus;
};
