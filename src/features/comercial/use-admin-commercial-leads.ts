import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
import { TablesInsert, TablesUpdate } from "@/lib/supabase/database.types";
import { supabase } from "@/lib/supabase/client";

import { CommercialLeadStatus } from "./constants";
import { comercialQueryKeys } from "./query-keys";
import { CommercialLead } from "./types";

export const useAdminCommercialLeads = (statusFilter = "all") =>
  useQuery({
    queryFn: async () => {
      let query = supabase.from("commercial_leads").select("*").order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as CommercialLead[];
    },
    queryKey: comercialQueryKeys.adminLeads(statusFilter),
    refetchInterval: statusFilter === "novo" ? 30000 : false,
  });

export const useAdminCommercialLead = (id: number | null) =>
  useQuery({
    enabled: id != null,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commercial_leads")
        .select("*")
        .eq("id", id as number)
        .maybeSingle();

      if (error) throw error;
      return data as CommercialLead | null;
    },
    queryKey: comercialQueryKeys.adminLead(id),
  });

export const useAdminUpdateCommercialLeadStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: CommercialLeadStatus }) => {
      const payload: TablesUpdate<"commercial_leads"> = { status };
      const { error } = await supabase.from("commercial_leads").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "comercial", "leads"] });
    },
  });
};

export const useAdminCreateCommercialLead = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (values: Omit<TablesInsert<"commercial_leads">, "id" | "created_at" | "updated_at">) => {
      if (!user) throw new Error("Sessão inválida.");

      const { data, error } = await supabase
        .from("commercial_leads")
        .insert(values)
        .select("id")
        .single();

      if (error) throw error;
      return data.id as number;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "comercial", "leads"] });
    },
  });
};
