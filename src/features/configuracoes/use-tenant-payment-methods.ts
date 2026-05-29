import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

import {
  defaultPaymentMethodInput,
  type PaymentMethodType,
  type TenantPaymentMethod,
  type TenantPaymentMethodInput,
} from "./payment-method-types";
import { configuracoesQueryKeys } from "./query-keys";

type PaymentMethodRow = {
  active: boolean;
  allowed_for_deposit: boolean;
  allowed_for_remaining_balance: boolean;
  allows_installments: boolean;
  fee_fixed: number | null;
  fee_percentage: number | null;
  id: number;
  max_installments: number | null;
  name: string;
  notes: string | null;
  payment_type: string;
  sort_order: number;
};

const mapPaymentMethodRow = (row: PaymentMethodRow): TenantPaymentMethod => ({
  active: row.active,
  allowedForDeposit: row.allowed_for_deposit,
  allowedForRemainingBalance: row.allowed_for_remaining_balance,
  allowsInstallments: row.allows_installments,
  feeFixed: row.fee_fixed,
  feePercentage: row.fee_percentage,
  id: String(row.id),
  maxInstallments: row.max_installments,
  name: row.name,
  notes: row.notes,
  paymentType: row.payment_type as PaymentMethodType,
  sortOrder: row.sort_order,
});

const invalidatePaymentMethods = (
  queryClient: ReturnType<typeof useQueryClient>,
  tenantId: number | null,
) => {
  void queryClient.invalidateQueries({
    queryKey: configuracoesQueryKeys.paymentMethods(tenantId),
  });
};

export const useTenantPaymentMethods = (options?: { includeInactive?: boolean }) => {
  const { currentTenantId } = useCurrentTenant();
  const includeInactive = options?.includeInactive ?? true;

  return useQuery({
    enabled: Boolean(currentTenantId),
    queryFn: async () => {
      let query = supabase
        .from("tenant_payment_methods")
        .select("*")
        .eq("tenant_id", currentTenantId as number)
        .order("sort_order", { ascending: true })
        .order("id", { ascending: true });

      if (!includeInactive) {
        query = query.eq("active", true);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map(mapPaymentMethodRow);
    },
    queryKey: configuracoesQueryKeys.paymentMethods(currentTenantId),
  });
};

export const useCreateTenantPaymentMethod = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: TenantPaymentMethodInput) => {
      if (!currentTenantId || !user) throw new Error("Sessao ou tenant atual indisponivel.");

      const { data: existing, error: sortError } = await supabase
        .from("tenant_payment_methods")
        .select("sort_order")
        .eq("tenant_id", currentTenantId)
        .order("sort_order", { ascending: false })
        .limit(1);

      if (sortError) throw sortError;

      const nextSortOrder =
        input.sortOrder > 0 ? input.sortOrder : (existing?.[0]?.sort_order ?? -1) + 1;

      const { error } = await supabase.from("tenant_payment_methods").insert({
        active: input.active,
        allowed_for_deposit: input.allowedForDeposit,
        allowed_for_remaining_balance: input.allowedForRemainingBalance,
        allows_installments: input.allowsInstallments,
        created_by: user.id,
        fee_fixed: input.feeFixed,
        fee_percentage: input.feePercentage,
        max_installments: input.allowsInstallments ? input.maxInstallments : null,
        name: input.name.trim(),
        notes: input.notes?.trim() || null,
        payment_type: input.paymentType,
        sort_order: nextSortOrder,
        tenant_id: currentTenantId,
        updated_by: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => invalidatePaymentMethods(queryClient, currentTenantId),
  });
};

export const useUpdateTenantPaymentMethod = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (method: TenantPaymentMethod) => {
      if (!currentTenantId || !user) throw new Error("Sessao ou tenant atual indisponivel.");

      const { error } = await supabase
        .from("tenant_payment_methods")
        .update({
          active: method.active,
          allowed_for_deposit: method.allowedForDeposit,
          allowed_for_remaining_balance: method.allowedForRemainingBalance,
          allows_installments: method.allowsInstallments,
          fee_fixed: method.feeFixed,
          fee_percentage: method.feePercentage,
          max_installments: method.allowsInstallments ? method.maxInstallments : null,
          name: method.name.trim(),
          notes: method.notes?.trim() || null,
          payment_type: method.paymentType,
          sort_order: method.sortOrder,
          updated_by: user.id,
        })
        .eq("tenant_id", currentTenantId)
        .eq("id", Number(method.id));

      if (error) throw error;
    },
    onSuccess: () => invalidatePaymentMethods(queryClient, currentTenantId),
  });
};

export const useToggleTenantPaymentMethodActive = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, active }: { active: boolean; id: string }) => {
      if (!currentTenantId || !user) throw new Error("Sessao ou tenant atual indisponivel.");

      const { error } = await supabase
        .from("tenant_payment_methods")
        .update({ active, updated_by: user.id })
        .eq("tenant_id", currentTenantId)
        .eq("id", Number(id));

      if (error) throw error;
    },
    onSuccess: () => invalidatePaymentMethods(queryClient, currentTenantId),
  });
};

export const useDeleteTenantPaymentMethod = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();

  return useMutation({
    mutationFn: async (methodId: string) => {
      if (!currentTenantId) throw new Error("Tenant atual indisponivel.");

      const { error } = await supabase
        .from("tenant_payment_methods")
        .delete()
        .eq("tenant_id", currentTenantId)
        .eq("id", Number(methodId));

      if (error) throw error;
    },
    onSuccess: () => invalidatePaymentMethods(queryClient, currentTenantId),
  });
};

export const useReorderTenantPaymentMethod = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, direction }: { direction: "up" | "down"; id: string }) => {
      if (!currentTenantId || !user) throw new Error("Sessao ou tenant atual indisponivel.");

      const { data: methods, error: fetchError } = await supabase
        .from("tenant_payment_methods")
        .select("id, sort_order")
        .eq("tenant_id", currentTenantId)
        .order("sort_order", { ascending: true })
        .order("id", { ascending: true });

      if (fetchError) throw fetchError;

      const index = (methods ?? []).findIndex((row) => String(row.id) === id);
      if (index < 0) return;

      const swapIndex = direction === "up" ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= (methods?.length ?? 0)) return;

      const current = methods![index];
      const target = methods![swapIndex];

      const { error: errorA } = await supabase
        .from("tenant_payment_methods")
        .update({ sort_order: target.sort_order, updated_by: user.id })
        .eq("tenant_id", currentTenantId)
        .eq("id", current.id);

      if (errorA) throw errorA;

      const { error: errorB } = await supabase
        .from("tenant_payment_methods")
        .update({ sort_order: current.sort_order, updated_by: user.id })
        .eq("tenant_id", currentTenantId)
        .eq("id", target.id);

      if (errorB) throw errorB;
    },
    onSuccess: () => invalidatePaymentMethods(queryClient, currentTenantId),
  });
};

export { defaultPaymentMethodInput };
