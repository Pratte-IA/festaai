import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
import { supabase } from "@/lib/supabase/client";

import { Tenant } from "./types";

export const tenantsQueryKey = ["tenants"] as const;

const fetchTenants = async (): Promise<Tenant[]> => {
  const { data, error } = await supabase
    .from("tenants")
    .select("id, name, slug, status, created_at, updated_at")
    .order("created_at", { ascending: true })
    .returns<Tenant[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
};

export const useTenants = () => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    enabled: isAuthenticated,
    queryFn: fetchTenants,
    queryKey: tenantsQueryKey,
    staleTime: 1000 * 60,
  });
};
