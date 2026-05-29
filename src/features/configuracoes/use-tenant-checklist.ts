import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";
import { ChecklistCategory } from "@/data/checklistConfig";

import { configuracoesQueryKeys } from "./query-keys";

const mapChecklistRows = (
  categories: Array<{
    active: boolean;
    created_at: string;
    id: number;
    name: string;
    sort_order: number;
  }>,
  items: Array<{
    active: boolean;
    category_id: number;
    created_at: string;
    id: number;
    label: string;
    sort_order: number;
  }>
): ChecklistCategory[] => {
  const itemsByCategory = new Map<number, ChecklistCategory["items"]>();

  items.forEach((item) => {
    const categoryItems = itemsByCategory.get(item.category_id) ?? [];
    categoryItems.push({
      active: item.active,
      id: String(item.id),
      label: item.label,
    });
    itemsByCategory.set(item.category_id, categoryItems);
  });

  return categories.map((category) => ({
    active: category.active,
    id: String(category.id),
    items: itemsByCategory.get(category.id) ?? [],
    name: category.name,
  }));
};

const fetchPackageChecklist = async (
  tenantId: number,
  packageId: string
): Promise<ChecklistCategory[]> => {
  const packageIdNumber = Number(packageId);

  const categoriesResult = await supabase
    .from("tenant_checklist_categories")
    .select("id, name, active, sort_order, created_at")
    .eq("tenant_id", tenantId)
    .eq("package_id", packageIdNumber)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (categoriesResult.error) throw categoriesResult.error;

  const categories = categoriesResult.data ?? [];
  if (categories.length === 0) return [];

  const categoryIds = categories.map((category) => category.id);
  const itemsResult = await supabase
    .from("tenant_checklist_items")
    .select("id, category_id, label, active, sort_order, created_at")
    .eq("tenant_id", tenantId)
    .in("category_id", categoryIds)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (itemsResult.error) throw itemsResult.error;

  return mapChecklistRows(categories, itemsResult.data ?? []);
};

export const useTenantChecklist = (packageId: string | null) => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(currentTenantId && packageId),
    queryFn: async () => fetchPackageChecklist(currentTenantId as number, packageId as string),
    queryKey: configuracoesQueryKeys.checklist(currentTenantId, packageId),
  });
};

export const useCreateChecklistCategory = (packageId: string | null) => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!currentTenantId || !user || !packageId) {
        throw new Error("Sessao, tenant ou pacote indisponivel.");
      }

      const { error } = await supabase.from("tenant_checklist_categories").insert({
        created_by: user.id,
        name,
        package_id: Number(packageId),
        tenant_id: currentTenantId,
        updated_by: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: configuracoesQueryKeys.checklist(currentTenantId, packageId),
      });
    },
  });
};

export const useCreateChecklistItem = (packageId: string | null) => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ categoryId, label }: { categoryId: string; label: string }) => {
      if (!currentTenantId || !user || !packageId) {
        throw new Error("Sessao, tenant ou pacote indisponivel.");
      }

      const { error } = await supabase.from("tenant_checklist_items").insert({
        category_id: Number(categoryId),
        created_by: user.id,
        label,
        tenant_id: currentTenantId,
        updated_by: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: configuracoesQueryKeys.checklist(currentTenantId, packageId),
      });
    },
  });
};

export const useUpdateChecklistCategory = (packageId: string | null) => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ active, categoryId }: { active: boolean; categoryId: string }) => {
      if (!currentTenantId || !user || !packageId) {
        throw new Error("Sessao, tenant ou pacote indisponivel.");
      }

      const { error } = await supabase
        .from("tenant_checklist_categories")
        .update({ active, updated_by: user.id })
        .eq("tenant_id", currentTenantId)
        .eq("package_id", Number(packageId))
        .eq("id", Number(categoryId));

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: configuracoesQueryKeys.checklist(currentTenantId, packageId),
      });
    },
  });
};

export const useUpdateChecklistItem = (packageId: string | null) => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ active, itemId }: { active: boolean; itemId: string }) => {
      if (!currentTenantId || !user || !packageId) {
        throw new Error("Sessao, tenant ou pacote indisponivel.");
      }

      const { error } = await supabase
        .from("tenant_checklist_items")
        .update({ active, updated_by: user.id })
        .eq("tenant_id", currentTenantId)
        .eq("id", Number(itemId));

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: configuracoesQueryKeys.checklist(currentTenantId, packageId),
      });
    },
  });
};

export const useDeleteChecklistCategory = (packageId: string | null) => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();

  return useMutation({
    mutationFn: async (categoryId: string) => {
      if (!currentTenantId || !packageId) throw new Error("Tenant ou pacote indisponivel.");

      const { error } = await supabase
        .from("tenant_checklist_categories")
        .delete()
        .eq("tenant_id", currentTenantId)
        .eq("package_id", Number(packageId))
        .eq("id", Number(categoryId));

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: configuracoesQueryKeys.checklist(currentTenantId, packageId),
      });
    },
  });
};

export const useDeleteChecklistItem = (packageId: string | null) => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();

  return useMutation({
    mutationFn: async (itemId: string) => {
      if (!currentTenantId || !packageId) throw new Error("Tenant ou pacote indisponivel.");

      const { error } = await supabase
        .from("tenant_checklist_items")
        .delete()
        .eq("tenant_id", currentTenantId)
        .eq("id", Number(itemId));

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: configuracoesQueryKeys.checklist(currentTenantId, packageId),
      });
    },
  });
};

export const useReplicateChecklistToPackage = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      sourcePackageId,
      targetPackageId,
    }: {
      sourcePackageId: string;
      targetPackageId: string;
    }) => {
      if (!currentTenantId || !user) throw new Error("Sessao ou tenant indisponivel.");
      if (sourcePackageId === targetPackageId) {
        throw new Error("Selecione um pacote de destino diferente.");
      }

      const sourceChecklist = await fetchPackageChecklist(currentTenantId, sourcePackageId);

      const { error: deleteError } = await supabase
        .from("tenant_checklist_categories")
        .delete()
        .eq("tenant_id", currentTenantId)
        .eq("package_id", Number(targetPackageId));

      if (deleteError) throw deleteError;

      for (const [index, category] of sourceChecklist.entries()) {
        const { data: createdCategory, error: categoryError } = await supabase
          .from("tenant_checklist_categories")
          .insert({
            active: category.active,
            created_by: user.id,
            name: category.name,
            package_id: Number(targetPackageId),
            sort_order: index,
            tenant_id: currentTenantId,
            updated_by: user.id,
          })
          .select("id")
          .single();

        if (categoryError) throw categoryError;

        if (category.items.length === 0) continue;

        const { error: itemsError } = await supabase.from("tenant_checklist_items").insert(
          category.items.map((item, itemIndex) => ({
            active: item.active,
            category_id: createdCategory.id,
            created_by: user.id,
            label: item.label,
            sort_order: itemIndex,
            tenant_id: currentTenantId,
            updated_by: user.id,
          }))
        );

        if (itemsError) throw itemsError;
      }
    },
    onSuccess: (_, { targetPackageId }) => {
      void queryClient.invalidateQueries({
        queryKey: configuracoesQueryKeys.checklist(currentTenantId, targetPackageId),
      });
    },
  });
};
