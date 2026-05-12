import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

import { eventosQueryKeys } from "./query-keys";
import { LeadCsvRowParsed } from "./parse-leads-csv";

const INSERT_BATCH_SIZE = 80;

export const useBulkCreateEventos = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (rows: LeadCsvRowParsed[]): Promise<{ insertedCount: number }> => {
      if (!currentTenantId || !user) {
        throw new Error("Sessao ou tenant atual indisponivel.");
      }
      if (rows.length === 0) {
        throw new Error("Nenhuma linha para importar.");
      }

      let insertedCount = 0;

      for (let offset = 0; offset < rows.length; offset += INSERT_BATCH_SIZE) {
        const batch = rows.slice(offset, offset + INSERT_BATCH_SIZE);
        const payloads = batch.map((row) => ({
          ...row,
          created_by: user.id,
          tenant_id: currentTenantId,
          updated_by: user.id,
        }));

        const { error, data } = await supabase.from("eventos").insert(payloads).select("id");

        if (error) {
          throw error;
        }

        insertedCount += data?.length ?? 0;
      }

      return { insertedCount };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: eventosQueryKeys.all(currentTenantId),
      });
    },
  });
};
