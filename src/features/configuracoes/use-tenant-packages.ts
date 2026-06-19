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
  parsePackageItems,
  serializePackagePricing,
} from "@/data/packagesData";

import { configuracoesQueryKeys } from "./query-keys";
import { guidedSetupQueryKeys } from "@/features/guided-setup/query-keys";
import { seedDefaultChecklistForPackage } from "./seed-default-checklist";
import { syncTenantAdditionals } from "./sync-tenant-additionals";

type PackageInput = Omit<PackageData, "id">;
type AdditionalInput = Omit<Additional, "id">;

type PackageRow = {
  active: boolean;
  buffet: unknown;
  description: string;
  duration_minutes: number | null;
  equipe: unknown;
  estrutura: unknown;
  excluded_items: unknown;
  id: number;
  included_guests: number | null;
  included_items: unknown;
  name: string;
  pricing_tiers: unknown;
  rules: string | null;
  sort_order: number;
};

type AdditionalRow = {
  active: boolean;
  category: string;
  description: string | null;
  id: number;
  is_required: boolean;
  name: string;
  package_ids: number[] | null;
  price: number;
  sort_order: number;
  type: string;
};

const mapPackageIds = (packageIds: number[] | null | undefined): string[] =>
  (packageIds ?? []).map(String);

const serializePackageIds = (packageIds: string[] | undefined): number[] =>
  (packageIds ?? []).map(Number).filter((id) => Number.isFinite(id) && id > 0);

const mapPackageRow = (row: PackageRow): PackageData => {
  const { schedule, tiers } = normalizePackagePricing(row.pricing_tiers);

  return {
    active: row.active,
    buffet: normalizeBuffetBlock(row.buffet),
    description: row.description ?? "",
    durationMinutes: row.duration_minutes,
    equipe: normalizeEquipe(row.equipe, tiers.map((tier) => tier.id)),
    estrutura: row.estrutura as PackageData["estrutura"],
    excludedItems: parsePackageItems(row.excluded_items),
    id: String(row.id),
    includedGuests: row.included_guests,
    includedItems: parsePackageItems(row.included_items),
    name: row.name,
    pricingSchedule: schedule,
    pricingTiers: tiers,
    rules: row.rules,
    sortOrder: row.sort_order,
  };
};

const mapAdditionalRow = (row: AdditionalRow): Additional => ({
  active: row.active,
  category: row.category as Additional["category"],
  description: row.description,
  id: String(row.id),
  isRequired: row.is_required,
  name: row.name,
  packageIds: mapPackageIds(row.package_ids),
  price: row.price,
  sortOrder: row.sort_order,
  type: row.type as Additional["type"],
});

const packageMetadataPayload = (pkg: PackageData | PackageInput) => ({
  duration_minutes: pkg.durationMinutes ?? null,
  excluded_items: (pkg.excludedItems ?? []) as unknown as Json,
  included_guests: pkg.includedGuests ?? null,
  included_items: (pkg.includedItems ?? []) as unknown as Json,
  rules: pkg.rules?.trim() || null,
});

const invalidatePackages = (
  queryClient: ReturnType<typeof useQueryClient>,
  tenantId: number | null,
) => {
  void queryClient.invalidateQueries({ queryKey: configuracoesQueryKeys.packages(tenantId) });
  void queryClient.invalidateQueries({ queryKey: configuracoesQueryKeys.packagesAdmin(tenantId) });
  void queryClient.invalidateQueries({ queryKey: guidedSetupQueryKeys.derived(tenantId) });
};

const invalidateAdditionals = (
  queryClient: ReturnType<typeof useQueryClient>,
  tenantId: number | null,
) => {
  void queryClient.invalidateQueries({ queryKey: configuracoesQueryKeys.additionals(tenantId) });
  void queryClient.invalidateQueries({ queryKey: configuracoesQueryKeys.additionalsAdmin(tenantId) });
};

export const fetchTenantPackages = async (
  tenantId: number,
  options?: { includeInactive?: boolean },
): Promise<PackageData[]> => {
  const includeInactive = options?.includeInactive ?? false;

  let query = supabase
    .from("tenant_packages")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (!includeInactive) {
    query = query.eq("active", true);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map(mapPackageRow);
};

export const useTenantPackages = (options?: { includeInactive?: boolean }) => {
  const { currentTenantId } = useCurrentTenant();
  const includeInactive = options?.includeInactive ?? false;

  return useQuery({
    enabled: Boolean(currentTenantId),
    queryFn: () => fetchTenantPackages(currentTenantId as number, { includeInactive }),
    queryKey: includeInactive
      ? configuracoesQueryKeys.packagesAdmin(currentTenantId)
      : configuracoesQueryKeys.packages(currentTenantId),
  });
};

/** @deprecated Use useTenantPackages({ includeInactive: true }) */
export const useTenantPackagesAdmin = () => useTenantPackages({ includeInactive: true });

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
          ...packageMetadataPayload(pkg),
          active: pkg.active ?? true,
          buffet: pkg.buffet as unknown as Json,
          description: pkg.description,
          equipe: pkg.equipe as unknown as Json,
          estrutura: pkg.estrutura as unknown as Json,
          name: pkg.name.trim(),
          pricing_tiers: serializePackagePricing(pkg.pricingSchedule, pkg.pricingTiers) as unknown as Json,
          sort_order: pkg.sortOrder ?? 0,
          updated_by: user.id,
        })
        .eq("tenant_id", currentTenantId)
        .eq("id", Number(pkg.id));

      if (error) throw error;
    },
    onSuccess: () => invalidatePackages(queryClient, currentTenantId),
  });
};

export const useCreateTenantPackage = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (pkg: PackageInput) => {
      if (!currentTenantId || !user) throw new Error("Sessao ou tenant atual indisponivel.");

      const { data: existing, error: sortError } = await supabase
        .from("tenant_packages")
        .select("sort_order")
        .eq("tenant_id", currentTenantId)
        .order("sort_order", { ascending: false })
        .limit(1);

      if (sortError) throw sortError;

      const nextSortOrder = (existing?.[0]?.sort_order ?? -1) + 1;

      const { data, error } = await supabase
        .from("tenant_packages")
        .insert({
          ...packageMetadataPayload(pkg),
          active: pkg.active ?? true,
          buffet: pkg.buffet as unknown as Json,
          created_by: user.id,
          description: pkg.description,
          equipe: pkg.equipe as unknown as Json,
          estrutura: pkg.estrutura as unknown as Json,
          name: pkg.name.trim(),
          pricing_tiers: serializePackagePricing(pkg.pricingSchedule, pkg.pricingTiers) as unknown as Json,
          sort_order: nextSortOrder,
          tenant_id: currentTenantId,
          updated_by: user.id,
        })
        .select("id")
        .single();

      if (error) throw error;
      if (!data?.id) throw new Error("Pacote nao foi persistido no banco de dados.");

      await seedDefaultChecklistForPackage(currentTenantId, data.id, user.id);

      return { id: String(data.id) };
    },
    onSuccess: () => invalidatePackages(queryClient, currentTenantId),
  });
};

export const useDeleteTenantPackage = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();

  return useMutation({
    mutationFn: async (packageId: string) => {
      if (!currentTenantId) throw new Error("Tenant atual indisponivel.");

      const { count, error: countError } = await supabase
        .from("eventos")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", currentTenantId)
        .eq("pacote_id", Number(packageId));

      if (countError) throw countError;

      if ((count ?? 0) > 0) {
        const { error } = await supabase
          .from("tenant_packages")
          .update({ active: false })
          .eq("tenant_id", currentTenantId)
          .eq("id", Number(packageId));

        if (error) throw error;
        return { deactivated: true as const };
      }

      const { error } = await supabase
        .from("tenant_packages")
        .delete()
        .eq("tenant_id", currentTenantId)
        .eq("id", Number(packageId));

      if (error) throw error;
      return { deactivated: false as const };
    },
    onSuccess: () => invalidatePackages(queryClient, currentTenantId),
  });
};

export const useToggleTenantPackageActive = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ active, id }: { active: boolean; id: string }) => {
      if (!currentTenantId || !user) throw new Error("Sessao ou tenant atual indisponivel.");

      const { error } = await supabase
        .from("tenant_packages")
        .update({ active, updated_by: user.id })
        .eq("tenant_id", currentTenantId)
        .eq("id", Number(id));

      if (error) throw error;
    },
    onSuccess: () => invalidatePackages(queryClient, currentTenantId),
  });
};

export const useDuplicateTenantPackage = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (packageId: string) => {
      if (!currentTenantId || !user) throw new Error("Sessao ou tenant atual indisponivel.");

      const { data: source, error: fetchError } = await supabase
        .from("tenant_packages")
        .select("*")
        .eq("tenant_id", currentTenantId)
        .eq("id", Number(packageId))
        .single();

      if (fetchError) throw fetchError;
      if (!source) throw new Error("Pacote nao encontrado.");

      const { data: existing, error: sortError } = await supabase
        .from("tenant_packages")
        .select("sort_order")
        .eq("tenant_id", currentTenantId)
        .order("sort_order", { ascending: false })
        .limit(1);

      if (sortError) throw sortError;

      const nextSortOrder = (existing?.[0]?.sort_order ?? -1) + 1;

      const { data, error } = await supabase
        .from("tenant_packages")
        .insert({
          active: true,
          buffet: source.buffet,
          created_by: user.id,
          description: source.description,
          duration_minutes: source.duration_minutes,
          equipe: source.equipe,
          estrutura: source.estrutura,
          excluded_items: source.excluded_items,
          included_guests: source.included_guests,
          included_items: source.included_items,
          name: `Cópia de ${source.name}`,
          pricing_tiers: source.pricing_tiers,
          rules: source.rules,
          sort_order: nextSortOrder,
          tenant_id: currentTenantId,
          updated_by: user.id,
        })
        .select("id")
        .single();

      if (error) throw error;
      if (!data?.id) throw new Error("Pacote duplicado nao foi persistido.");

      await seedDefaultChecklistForPackage(currentTenantId, data.id, user.id);
    },
    onSuccess: () => invalidatePackages(queryClient, currentTenantId),
  });
};

export const useReorderTenantPackage = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ direction, id }: { direction: "up" | "down"; id: string }) => {
      if (!currentTenantId || !user) throw new Error("Sessao ou tenant atual indisponivel.");

      const { data: packages, error: fetchError } = await supabase
        .from("tenant_packages")
        .select("id, sort_order")
        .eq("tenant_id", currentTenantId)
        .order("sort_order", { ascending: true })
        .order("id", { ascending: true });

      if (fetchError) throw fetchError;

      const index = (packages ?? []).findIndex((row) => String(row.id) === id);
      if (index < 0) return;

      const swapIndex = direction === "up" ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= (packages?.length ?? 0)) return;

      const current = packages![index];
      const target = packages![swapIndex];

      const { error: errorA } = await supabase
        .from("tenant_packages")
        .update({ sort_order: target.sort_order, updated_by: user.id })
        .eq("tenant_id", currentTenantId)
        .eq("id", current.id);

      if (errorA) throw errorA;

      const { error: errorB } = await supabase
        .from("tenant_packages")
        .update({ sort_order: current.sort_order, updated_by: user.id })
        .eq("tenant_id", currentTenantId)
        .eq("id", target.id);

      if (errorB) throw errorB;
    },
    onSuccess: () => invalidatePackages(queryClient, currentTenantId),
  });
};

export const useTenantAdditionals = (options?: { includeInactive?: boolean }) => {
  const { currentTenantId } = useCurrentTenant();
  const includeInactive = options?.includeInactive ?? false;

  return useQuery({
    enabled: Boolean(currentTenantId),
    queryFn: async () => {
      let query = supabase
        .from("tenant_additionals")
        .select("*")
        .eq("tenant_id", currentTenantId as number)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (!includeInactive) {
        query = query.eq("active", true);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map(mapAdditionalRow);
    },
    queryKey: includeInactive
      ? configuracoesQueryKeys.additionalsAdmin(currentTenantId)
      : configuracoesQueryKeys.additionals(currentTenantId),
  });
};

/** @deprecated Use useTenantAdditionals({ includeInactive: true }) */
export const useTenantAdditionalsAdmin = () => useTenantAdditionals({ includeInactive: true });

export const useCreateTenantAdditional = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (additional: AdditionalInput) => {
      if (!currentTenantId || !user) throw new Error("Sessao ou tenant atual indisponivel.");

      const { data: existing, error: sortError } = await supabase
        .from("tenant_additionals")
        .select("sort_order")
        .eq("tenant_id", currentTenantId)
        .order("sort_order", { ascending: false })
        .limit(1);

      if (sortError) throw sortError;

      const nextSortOrder = (existing?.[0]?.sort_order ?? -1) + 1;

      const { error } = await supabase.from("tenant_additionals").insert({
        active: additional.active ?? true,
        category: additional.category,
        created_by: user.id,
        description: additional.description?.trim() || null,
        is_required: false,
        name: additional.name.trim(),
        package_ids: serializePackageIds(additional.packageIds),
        price: additional.price,
        sort_order: nextSortOrder,
        tenant_id: currentTenantId,
        type: additional.type,
        updated_by: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => invalidateAdditionals(queryClient, currentTenantId),
  });
};

export const useUpdateTenantAdditional = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (additional: Additional) => {
      if (!currentTenantId || !user) throw new Error("Sessao ou tenant atual indisponivel.");

      const { error } = await supabase
        .from("tenant_additionals")
        .update({
          active: additional.active ?? true,
          category: additional.category,
          description: additional.description?.trim() || null,
          is_required: false,
          name: additional.name.trim(),
          package_ids: serializePackageIds(additional.packageIds),
          price: additional.price,
          sort_order: additional.sortOrder ?? 0,
          type: additional.type,
          updated_by: user.id,
        })
        .eq("tenant_id", currentTenantId)
        .eq("id", Number(additional.id));

      if (error) throw error;
    },
    onSuccess: () => invalidateAdditionals(queryClient, currentTenantId),
  });
};

export const useToggleTenantAdditionalActive = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ active, id }: { active: boolean; id: string }) => {
      if (!currentTenantId || !user) throw new Error("Sessao ou tenant atual indisponivel.");

      const { error } = await supabase
        .from("tenant_additionals")
        .update({ active, updated_by: user.id })
        .eq("tenant_id", currentTenantId)
        .eq("id", Number(id));

      if (error) throw error;
    },
    onSuccess: () => invalidateAdditionals(queryClient, currentTenantId),
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
    onSuccess: () => invalidateAdditionals(queryClient, currentTenantId),
  });
};

export const useSyncTenantAdditionals = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      desired,
      existing,
    }: {
      desired: Additional[];
      existing: Additional[];
    }) => {
      if (!currentTenantId || !user) {
        throw new Error("Sessao ou tenant atual indisponivel.");
      }

      return syncTenantAdditionals({
        desired,
        existing,
        tenantId: currentTenantId,
        userId: user.id,
      });
    },
    onSuccess: () => invalidateAdditionals(queryClient, currentTenantId),
  });
};

export const useReorderTenantAdditional = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ direction, id }: { direction: "up" | "down"; id: string }) => {
      if (!currentTenantId || !user) throw new Error("Sessao ou tenant atual indisponivel.");

      const { data: items, error: fetchError } = await supabase
        .from("tenant_additionals")
        .select("id, sort_order")
        .eq("tenant_id", currentTenantId)
        .order("sort_order", { ascending: true })
        .order("id", { ascending: true });

      if (fetchError) throw fetchError;

      const index = (items ?? []).findIndex((row) => String(row.id) === id);
      if (index < 0) return;

      const swapIndex = direction === "up" ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= (items?.length ?? 0)) return;

      const current = items![index];
      const target = items![swapIndex];

      const { error: errorA } = await supabase
        .from("tenant_additionals")
        .update({ sort_order: target.sort_order, updated_by: user.id })
        .eq("tenant_id", currentTenantId)
        .eq("id", current.id);

      if (errorA) throw errorA;

      const { error: errorB } = await supabase
        .from("tenant_additionals")
        .update({ sort_order: current.sort_order, updated_by: user.id })
        .eq("tenant_id", currentTenantId)
        .eq("id", target.id);

      if (errorB) throw errorB;
    },
    onSuccess: () => invalidateAdditionals(queryClient, currentTenantId),
  });
};
