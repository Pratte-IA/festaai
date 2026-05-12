import { useQuery } from "@tanstack/react-query";

import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

import { supportErrorReportsQueryKey } from "./query-keys";

export interface TenantSupportErrorReportRow {
  created_at: string;
  description: string;
  id: number;
  support_error_report_files: { id: number }[];
  title: string;
}

export const useTenantSupportErrorReports = () => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: currentTenantId != null,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_error_reports")
        .select("id, title, description, created_at, support_error_report_files ( id )")
        .eq("tenant_id", currentTenantId as number)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return (data ?? []) as TenantSupportErrorReportRow[];
    },
    queryKey: supportErrorReportsQueryKey(currentTenantId),
  });
};
