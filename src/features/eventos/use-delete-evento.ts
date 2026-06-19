import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

import { eventosQueryKeys } from "./query-keys";

export const useDeleteEvento = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();

  return useMutation({
    mutationFn: async (eventoId: number) => {
      if (!currentTenantId) {
        throw new Error("Tenant atual indisponivel.");
      }

      const { error } = await supabase
        .from("eventos")
        .delete()
        .eq("id", eventoId)
        .eq("tenant_id", currentTenantId);

      if (error) {
        throw error;
      }
    },
    onSuccess: (_, eventoId) => {
      queryClient.removeQueries({
        queryKey: eventosQueryKeys.detail(currentTenantId, eventoId),
      });
      void queryClient.invalidateQueries({
        queryKey: eventosQueryKeys.all(currentTenantId),
      });
    },
  });
};
