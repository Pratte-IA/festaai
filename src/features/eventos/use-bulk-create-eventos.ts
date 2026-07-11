import { useMutation, useQueryClient } from "@tanstack/react-query";

import { fetchTenantPackages } from "@/features/configuracoes/use-tenant-packages";
import { useAuth } from "@/features/auth";
import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

import { buildPackageEventoUpdates } from "./closing-form-runtime";
import { eventosQueryKeys } from "./query-keys";
import { LeadCsvRowParsed } from "./parse-leads-csv";
import { resolvePackageByName } from "./resolve-package-by-name";

const INSERT_BATCH_SIZE = 80;

const enrichLeadRowWithPackage = (
  row: LeadCsvRowParsed,
  packages: Awaited<ReturnType<typeof fetchTenantPackages>>,
): LeadCsvRowParsed & { pacote_convidados_inclusos?: number | null; pacote_id?: number | null } => {
  if (!row.pacote_nome?.trim()) {
    return row;
  }

  const matched = resolvePackageByName(row.pacote_nome, packages);
  if (!matched) {
    return row;
  }

  const pkg = packages.find((item) => item.id === matched.id);
  if (!pkg) {
    return row;
  }

  const guestCount = row.quantidade_convidados ?? 0;
  const packageUpdates = buildPackageEventoUpdates(pkg, guestCount, row.data_evento);
  const valor_pacote = packageUpdates.valor_pacote ?? row.valor_pacote;
  const valor_total = Math.round((valor_pacote + row.valor_adicionais) * 100) / 100;

  return {
    ...row,
    pacote_convidados_inclusos: packageUpdates.pacote_convidados_inclusos,
    pacote_id: Number(pkg.id),
    pacote_nome: packageUpdates.pacote_nome ?? pkg.name,
    valor_pacote,
    valor_total,
  };
};

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

      const packages = await fetchTenantPackages(currentTenantId);
      let insertedCount = 0;

      for (let offset = 0; offset < rows.length; offset += INSERT_BATCH_SIZE) {
        const batch = rows.slice(offset, offset + INSERT_BATCH_SIZE);
        const payloads = batch.map((row) => {
          const enriched = enrichLeadRowWithPackage(row, packages);
          return {
            ...enriched,
            created_by: user.id,
            tenant_id: currentTenantId,
            updated_by: user.id,
          };
        });

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
