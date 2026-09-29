import { Tables } from "@/lib/supabase/database.types";

export type TenantStatus = "active" | "trialing" | "past_due" | "suspended" | "canceled";

export type Tenant = Omit<Tables<"tenants">, "status"> & {
  status: TenantStatus;
};

export type TenantUnitKind = "matriz" | "filial";

export type TenantUnitStatus = "active" | "inactive";

export type TenantUnit = Omit<Tables<"tenant_units">, "kind" | "status"> & {
  kind: TenantUnitKind;
  status: TenantUnitStatus;
};
