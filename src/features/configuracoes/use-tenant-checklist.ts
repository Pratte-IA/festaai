import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";
import { ChecklistCategory } from "@/data/checklistConfig";

import { configuracoesQueryKeys } from "./query-keys";

export const useTenantChecklist = () => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(currentTenantId),
    queryFn: async (): Promise<ChecklistCategory[]> => {
      const [categoriesResult, itemsResult] = await Promise.all([
        supabase
          .from("tenant_checklist_categories")
          .select("*")
          .eq("tenant_id", currentTenantId as number)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
        supabase
          .from("tenant_checklist_items")
          .select("*")
          .eq("tenant_id", currentTenantId as number)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
      ]);

      if (categoriesResult.error) throw categoriesResult.error;
      if (itemsResult.error) throw itemsResult.error;

      const itemsByCategory = new Map<number, ChecklistCategory["items"]>();
      (itemsResult.data ?? []).forEach((item) => {
        const items = itemsByCategory.get(item.category_id) ?? [];
        items.push({
          active: item.active,
          id: String(item.id),
          label: item.label,
        });
        itemsByCategory.set(item.category_id, items);
      });

      return (categoriesResult.data ?? []).map((category) => ({
        active: category.active,
        id: String(category.id),
        items: itemsByCategory.get(category.id) ?? [],
        name: category.name,
      }));
    },
    queryKey: configuracoesQueryKeys.checklist(currentTenantId),
  });
};

export const useCreateChecklistCategory = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!currentTenantId || !user) throw new Error("Sessao ou tenant atual indisponivel.");

      const { error } = await supabase.from("tenant_checklist_categories").insert({
        created_by: user.id,
        name,
        tenant_id: currentTenantId,
        updated_by: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: configuracoesQueryKeys.checklist(currentTenantId) });
    },
  });
};

export const useCreateChecklistItem = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ categoryId, label }: { categoryId: string; label: string }) => {
      if (!currentTenantId || !user) throw new Error("Sessao ou tenant atual indisponivel.");

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
      void queryClient.invalidateQueries({ queryKey: configuracoesQueryKeys.checklist(currentTenantId) });
    },
  });
};

export const useUpdateChecklistCategory = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ active, categoryId }: { active: boolean; categoryId: string }) => {
      if (!currentTenantId || !user) throw new Error("Sessao ou tenant atual indisponivel.");

      const { error } = await supabase
        .from("tenant_checklist_categories")
        .update({ active, updated_by: user.id })
        .eq("tenant_id", currentTenantId)
        .eq("id", Number(categoryId));

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: configuracoesQueryKeys.checklist(currentTenantId) });
    },
  });
};

export const useUpdateChecklistItem = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ active, itemId }: { active: boolean; itemId: string }) => {
      if (!currentTenantId || !user) throw new Error("Sessao ou tenant atual indisponivel.");

      const { error } = await supabase
        .from("tenant_checklist_items")
        .update({ active, updated_by: user.id })
        .eq("tenant_id", currentTenantId)
        .eq("id", Number(itemId));

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: configuracoesQueryKeys.checklist(currentTenantId) });
    },
  });
};

export const useDeleteChecklistCategory = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();

  return useMutation({
    mutationFn: async (categoryId: string) => {
      if (!currentTenantId) throw new Error("Tenant atual indisponivel.");

      const { error } = await supabase
        .from("tenant_checklist_categories")
        .delete()
        .eq("tenant_id", currentTenantId)
        .eq("id", Number(categoryId));

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: configuracoesQueryKeys.checklist(currentTenantId) });
    },
  });
};

export const useDeleteChecklistItem = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();

  return useMutation({
    mutationFn: async (itemId: string) => {
      if (!currentTenantId) throw new Error("Tenant atual indisponivel.");

      const { error } = await supabase
        .from("tenant_checklist_items")
        .delete()
        .eq("tenant_id", currentTenantId)
        .eq("id", Number(itemId));

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: configuracoesQueryKeys.checklist(currentTenantId) });
    },
  });
};
