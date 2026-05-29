import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";
import { Json } from "@/lib/supabase/database.types";
import {
  Additional,
  normalizeBuffetBlock,
  normalizeEquipe,
  normalizePackagePricing,
  PackageData,
  serializePackagePricing,
} from "@/data/packagesData";

import { configuracoesQueryKeys } from "./query-keys";
import { seedDefaultChecklistForPackage } from "./seed-default-checklist";

type PackageInput = Omit<PackageData, "id">;
type AdditionalInput = Omit<Additional, "id">;

const mapPackageRow = (row: {
  id: number;
  name: string;
  description: string;
  buffet: unknown;
  estrutura: unknown;
  equipe: unknown;
  pricing_tiers: unknown;
}): PackageData => {
  const { schedule, tiers } = normalizePackagePricing(row.pricing_tiers);

  return {
    id: String(row.id),
    name: row.name,
    description: row.description ?? "",
    buffet: normalizeBuffetBlock(row.buffet),
    estrutura: row.estrutura as PackageData["estrutura"],
    equipe: normalizeEquipe(row.equipe, tiers.map((tier) => tier.id)),
    pricingSchedule: schedule,
    pricingTiers: tiers,
  };
};

const mapAdditionalRow = (row: {
  category: string;
  id: number;
  name: string;
  price: number;
  type: string;
}): Additional => ({
  category: row.category as Additional["category"],
  id: String(row.id),
  name: row.name,
  price: row.price,
  type: row.type as Additional["type"],
});

export const useTenantPackages = () => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(currentTenantId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenant_packages")
        .select("*")
        .eq("tenant_id", currentTenantId as number)
        .eq("active", true)
        .order("created_at", { ascending: true });

      if (error) throw error;

      return (data ?? []).map(mapPackageRow);
    },
    queryKey: configuracoesQueryKeys.packages(currentTenantId),
  });
};

export const useUpdateTenantPackage = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (pkg: PackageData) => {
      if (!currentTenantId || !user) throw new Error("Sessao ou tenant atual indisponivel.");

      const { error } = await supabase
        .from("tenant_packages")
        .update({
          buffet: pkg.buffet as unknown as Json,
          description: pkg.description,
          equipe: pkg.equipe as unknown as Json,
          estrutura: pkg.estrutura as unknown as Json,
          name: pkg.name.trim(),
          pricing_tiers: serializePackagePricing(pkg.pricingSchedule, pkg.pricingTiers) as unknown as Json,
          updated_by: user.id,
        })
        .eq("tenant_id", currentTenantId)
        .eq("id", Number(pkg.id));

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: configuracoesQueryKeys.packages(currentTenantId) });
    },
  });
};

export const useCreateTenantPackage = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (pkg: PackageInput) => {
      if (!currentTenantId || !user) throw new Error("Sessao ou tenant atual indisponivel.");

      const { data, error } = await supabase
        .from("tenant_packages")
        .insert({
          buffet: pkg.buffet as unknown as Json,
          created_by: user.id,
          description: pkg.description,
          equipe: pkg.equipe as unknown as Json,
          estrutura: pkg.estrutura as unknown as Json,
          name: pkg.name.trim(),
          pricing_tiers: serializePackagePricing(pkg.pricingSchedule, pkg.pricingTiers) as unknown as Json,
          tenant_id: currentTenantId,
          updated_by: user.id,
        })
        .select("id")
        .single();

      if (error) throw error;
      if (!data?.id) throw new Error("Pacote nao foi persistido no banco de dados.");

      await seedDefaultChecklistForPackage(currentTenantId, data.id, user.id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: configuracoesQueryKeys.packages(currentTenantId) });
    },
  });
};

export const useDeleteTenantPackage = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();

  return useMutation({
    mutationFn: async (packageId: string) => {
      if (!currentTenantId) throw new Error("Tenant atual indisponivel.");

      const { error } = await supabase
        .from("tenant_packages")
        .delete()
        .eq("tenant_id", currentTenantId)
        .eq("id", Number(packageId));

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: configuracoesQueryKeys.packages(currentTenantId) });
    },
  });
};

export const useTenantAdditionals = () => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(currentTenantId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenant_additionals")
        .select("*")
        .eq("tenant_id", currentTenantId as number)
        .eq("active", true)
        .order("created_at", { ascending: true });

      if (error) throw error;

      return (data ?? []).map(mapAdditionalRow);
    },
    queryKey: configuracoesQueryKeys.additionals(currentTenantId),
  });
};

export const useCreateTenantAdditional = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (additional: AdditionalInput) => {
      if (!currentTenantId || !user) throw new Error("Sessao ou tenant atual indisponivel.");

      const { error } = await supabase.from("tenant_additionals").insert({
        category: additional.category,
        created_by: user.id,
        name: additional.name,
        price: additional.price,
        tenant_id: currentTenantId,
        type: additional.type,
        updated_by: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: configuracoesQueryKeys.additionals(currentTenantId) });
    },
  });
};

export const useDeleteTenantAdditional = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();

  return useMutation({
    mutationFn: async (additionalId: string) => {
      if (!currentTenantId) throw new Error("Tenant atual indisponivel.");

      const { error } = await supabase
        .from("tenant_additionals")
        .delete()
        .eq("tenant_id", currentTenantId)
        .eq("id", Number(additionalId));

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: configuracoesQueryKeys.additionals(currentTenantId) });
    },
  });
};
