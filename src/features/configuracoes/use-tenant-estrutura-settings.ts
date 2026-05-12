import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
import { useCurrentTenant } from "@/features/tenants";
import type { EstruturaBlock } from "@/data/packagesData";
import { supabase } from "@/lib/supabase/client";
import { Json } from "@/lib/supabase/database.types";

import { configuracoesQueryKeys } from "./query-keys";

export const emptyEstruturaBlock = (): EstruturaBlock => ({
  brinquedos: [],
  espaco: [],
  decoracao: [],
});

const mapRow = (estrutura: unknown): EstruturaBlock => {
  const e = estrutura as Partial<EstruturaBlock> | null | undefined;
  if (!e || !Array.isArray(e.brinquedos)) return emptyEstruturaBlock();
  return {
    brinquedos: [...e.brinquedos],
    espaco: [],
    decoracao: [],
  };
};

export const useTenantEstruturaSettings = () => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(currentTenantId),
    queryFn: async (): Promise<EstruturaBlock> => {
      const { data, error } = await supabase
        .from("tenant_estrutura_settings")
        .select("estrutura")
        .eq("tenant_id", currentTenantId as number)
        .maybeSingle();

      if (error) throw error;

      return mapRow(data?.estrutura);
    },
    queryKey: configuracoesQueryKeys.estrutura(currentTenantId),
  });
};

export const useSaveTenantEstruturaSettings = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (estrutura: EstruturaBlock) => {
      if (!currentTenantId || !user) throw new Error("Sessao ou tenant atual indisponivel.");

      const normalized: EstruturaBlock = {
        brinquedos: [...estrutura.brinquedos],
        espaco: [],
        decoracao: [],
      };
      const asJson = normalized as unknown as Json;

      const { error: upsertError } = await supabase.from("tenant_estrutura_settings").upsert(
        {
          created_by: user.id,
          estrutura: asJson,
          tenant_id: currentTenantId,
          updated_by: user.id,
        },
        { onConflict: "tenant_id" },
      );

      if (upsertError) throw upsertError;

      const { error: pkgError } = await supabase
        .from("tenant_packages")
        .update({ estrutura: asJson, updated_by: user.id })
        .eq("tenant_id", currentTenantId)
        .eq("active", true);

      if (pkgError) throw pkgError;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: configuracoesQueryKeys.estrutura(currentTenantId),
      });
      void queryClient.invalidateQueries({
        queryKey: configuracoesQueryKeys.packages(currentTenantId),
      });
    },
  });
};
