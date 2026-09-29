import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase/client";

import { tenantUnitsQueryKey } from "./use-tenant-units";

export const slugifyUnitName = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

export const useCreateFilial = (tenantId: number | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { name: string; slug: string }) => {
      if (!tenantId) throw new Error("Tenant atual indisponível.");

      const { data, error } = await supabase.rpc("create_tenant_filial", {
        p_name: input.name.trim(),
        p_slug: input.slug,
        p_tenant_id: tenantId,
      });

      if (error) throw error;
      if (!data) throw new Error("A filial não foi criada.");

      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tenantUnitsQueryKey(tenantId) });
    },
  });
};
