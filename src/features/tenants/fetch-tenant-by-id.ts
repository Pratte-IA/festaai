import { supabase } from "@/lib/supabase/client";

import { Tenant } from "./types";

export const tenantByIdQueryKey = (tenantId: number) => ["tenant", tenantId] as const;

export const fetchTenantById = async (tenantId: number): Promise<Tenant> => {
  const { data, error } = await supabase
    .from("tenants")
    .select("id, name, slug, status, created_at, updated_at")
    .eq("id", tenantId)
    .maybeSingle<Tenant>();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Empresa não encontrada.");
  }

  return data;
};
