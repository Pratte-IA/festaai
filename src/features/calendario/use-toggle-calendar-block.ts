import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

import { calendarioQueryKeys } from "./query-keys";

interface ToggleCalendarBlockInput {
  blockId: number | null;
  date: string;
  isBlocked: boolean;
}

export const useToggleCalendarBlock = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: ToggleCalendarBlockInput) => {
      if (!currentTenantId || !user) {
        throw new Error("Sessao ou tenant atual indisponivel.");
      }

      if (input.isBlocked && input.blockId) {
        const { error } = await supabase
          .from("calendar_blocks")
          .delete()
          .eq("id", input.blockId)
          .eq("tenant_id", currentTenantId);

        if (error) {
          throw error;
        }

        return;
      }

      const { error } = await supabase.from("calendar_blocks").insert({
        created_by: user.id,
        data: input.date,
        tenant_id: currentTenantId,
        updated_by: user.id,
      });

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: calendarioQueryKeys.all(currentTenantId),
      });
    },
  });
};
