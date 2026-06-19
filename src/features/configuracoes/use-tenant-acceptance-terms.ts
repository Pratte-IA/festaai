import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

import {
  isLockedSystemTerm,
  type TenantAcceptanceTerm,
  type TenantAcceptanceTermInput,
} from "./acceptance-term-types";
import { configuracoesQueryKeys } from "./query-keys";

type AcceptanceTermRow = {
  active: boolean;
  appears_in_contract: boolean;
  content: string;
  created_at: string;
  id: number;
  is_required: boolean;
  is_system: boolean;
  show_at_signing: boolean;
  show_in_form: boolean;
  sort_order: number;
  term_key: string | null;
  title: string;
  updated_at: string;
};

const mapAcceptanceTermRow = (row: AcceptanceTermRow): TenantAcceptanceTerm => ({
  active: row.active,
  appearsInContract: row.appears_in_contract,
  content: row.content,
  createdAt: row.created_at,
  id: String(row.id),
  isRequired: row.is_required,
  isSystem: row.is_system,
  showAtSigning: row.show_at_signing,
  showInForm: row.show_in_form,
  sortOrder: row.sort_order,
  termKey: row.term_key,
  title: row.title,
  updatedAt: row.updated_at,
});

const invalidateAcceptanceTerms = (
  queryClient: ReturnType<typeof useQueryClient>,
  tenantId: number | null,
) => {
  void queryClient.invalidateQueries({
    queryKey: configuracoesQueryKeys.acceptanceTerms(tenantId),
  });
};

export const useTenantAcceptanceTerms = () => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(currentTenantId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenant_acceptance_terms")
        .select("*")
        .eq("tenant_id", currentTenantId as number)
        .order("sort_order", { ascending: true })
        .order("id", { ascending: true });

      if (error) throw error;

      return (data ?? []).map(mapAcceptanceTermRow);
    },
    queryKey: configuracoesQueryKeys.acceptanceTerms(currentTenantId),
  });
};

export const useCreateTenantAcceptanceTerm = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: TenantAcceptanceTermInput) => {
      if (!currentTenantId || !user) throw new Error("Sessao ou tenant atual indisponivel.");

      const { data: existing, error: sortError } = await supabase
        .from("tenant_acceptance_terms")
        .select("sort_order")
        .eq("tenant_id", currentTenantId)
        .order("sort_order", { ascending: false })
        .limit(1);

      if (sortError) throw sortError;

      const nextSortOrder =
        input.sortOrder > 0 ? input.sortOrder : (existing?.[0]?.sort_order ?? -1) + 1;

      const { error } = await supabase.from("tenant_acceptance_terms").insert({
        active: input.active,
        appears_in_contract: input.appearsInContract,
        content: input.content.trim(),
        created_by: user.id,
        is_required: input.isRequired,
        is_system: false,
        show_at_signing: input.showAtSigning,
        show_in_form: input.showInForm,
        sort_order: nextSortOrder,
        tenant_id: currentTenantId,
        term_key: null,
        title: input.title.trim(),
        updated_by: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => invalidateAcceptanceTerms(queryClient, currentTenantId),
  });
};

export const useUpdateTenantAcceptanceTerm = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (term: TenantAcceptanceTerm) => {
      if (!currentTenantId || !user) throw new Error("Sessao ou tenant atual indisponivel.");

      if (term.isSystem && isLockedSystemTerm(term) && !term.active) {
        throw new Error("Este termo essencial nao pode ser inativado.");
      }

      const payload = term.isSystem
        ? {
            active: term.active,
            appears_in_contract: term.appearsInContract,
            content: term.content.trim(),
            is_required: term.isRequired,
            show_at_signing: term.showAtSigning,
            show_in_form: term.showInForm,
            sort_order: term.sortOrder,
            updated_by: user.id,
          }
        : {
            active: term.active,
            appears_in_contract: term.appearsInContract,
            content: term.content.trim(),
            is_required: term.isRequired,
            show_at_signing: term.showAtSigning,
            show_in_form: term.showInForm,
            sort_order: term.sortOrder,
            title: term.title.trim(),
            updated_by: user.id,
          };

      const { error } = await supabase
        .from("tenant_acceptance_terms")
        .update(payload)
        .eq("tenant_id", currentTenantId)
        .eq("id", Number(term.id));

      if (error) throw error;
    },
    onSuccess: () => invalidateAcceptanceTerms(queryClient, currentTenantId),
  });
};

export const useToggleTenantAcceptanceTermActive = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      active,
      term,
    }: {
      active: boolean;
      term: TenantAcceptanceTerm;
    }) => {
      if (!currentTenantId || !user) throw new Error("Sessao ou tenant atual indisponivel.");

      if (!active && isLockedSystemTerm(term)) {
        throw new Error("Este termo essencial nao pode ser inativado.");
      }

      const { error } = await supabase
        .from("tenant_acceptance_terms")
        .update({ active, updated_by: user.id })
        .eq("tenant_id", currentTenantId)
        .eq("id", Number(term.id));

      if (error) throw error;
    },
    onSuccess: () => invalidateAcceptanceTerms(queryClient, currentTenantId),
  });
};

export const useDeleteTenantAcceptanceTerm = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (term: TenantAcceptanceTerm) => {
      if (!currentTenantId) throw new Error("Tenant atual indisponivel.");

      if (term.isSystem) {
        if (isLockedSystemTerm(term)) {
          throw new Error("Termos essenciais do sistema nao podem ser excluidos.");
        }

        const { error } = await supabase
          .from("tenant_acceptance_terms")
          .update({ active: false, updated_by: user?.id ?? null })
          .eq("tenant_id", currentTenantId)
          .eq("id", Number(term.id));

        if (error) throw error;
        return { deactivated: true as const, reason: "system" as const };
      }

      const { count, error: countError } = await supabase
        .from("evento_acceptance_responses")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", currentTenantId)
        .eq("term_id", Number(term.id));

      if (countError) throw countError;

      if ((count ?? 0) > 0) {
        const { error } = await supabase
          .from("tenant_acceptance_terms")
          .update({ active: false, updated_by: user?.id ?? null })
          .eq("tenant_id", currentTenantId)
          .eq("id", Number(term.id));

        if (error) throw error;
        return { deactivated: true as const, reason: "in_use" as const };
      }

      const { error } = await supabase
        .from("tenant_acceptance_terms")
        .delete()
        .eq("tenant_id", currentTenantId)
        .eq("id", Number(term.id));

      if (error) throw error;
      return { deactivated: false as const };
    },
    onSuccess: () => invalidateAcceptanceTerms(queryClient, currentTenantId),
  });
};

export const useReorderTenantAcceptanceTerm = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ direction, id }: { direction: "up" | "down"; id: string }) => {
      if (!currentTenantId || !user) throw new Error("Sessao ou tenant atual indisponivel.");

      const { data: terms, error: fetchError } = await supabase
        .from("tenant_acceptance_terms")
        .select("id, sort_order")
        .eq("tenant_id", currentTenantId)
        .order("sort_order", { ascending: true })
        .order("id", { ascending: true });

      if (fetchError) throw fetchError;

      const index = (terms ?? []).findIndex((row) => String(row.id) === id);
      if (index < 0) return;

      const swapIndex = direction === "up" ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= (terms?.length ?? 0)) return;

      const current = terms![index];
      const target = terms![swapIndex];

      const { error: errorA } = await supabase
        .from("tenant_acceptance_terms")
        .update({ sort_order: target.sort_order, updated_by: user.id })
        .eq("tenant_id", currentTenantId)
        .eq("id", current.id);

      if (errorA) throw errorA;

      const { error: errorB } = await supabase
        .from("tenant_acceptance_terms")
        .update({ sort_order: current.sort_order, updated_by: user.id })
        .eq("tenant_id", currentTenantId)
        .eq("id", target.id);

      if (errorB) throw errorB;
    },
    onSuccess: () => invalidateAcceptanceTerms(queryClient, currentTenantId),
  });
};
