import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

import {
  ClosingFormField,
  ClosingFormFieldType,
  ClosingFormSection,
} from "./closing-form-types";
import { configuracoesQueryKeys } from "./query-keys";

const mapFieldRow = (row: {
  active: boolean;
  field_key: string | null;
  field_type: string;
  id: number;
  is_system: boolean;
  label: string;
  required: boolean;
  section: string;
  sort_order: number;
}): ClosingFormField => ({
  active: row.active,
  fieldKey: row.field_key,
  fieldType: row.field_type as ClosingFormFieldType,
  id: String(row.id),
  isSystem: row.is_system,
  label: row.label,
  required: row.required,
  section: row.section as ClosingFormSection,
  sortOrder: row.sort_order,
});

export const useTenantClosingForm = () => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(currentTenantId),
    queryFn: async (): Promise<ClosingFormField[]> => {
      const { data, error } = await supabase
        .from("tenant_closing_form_fields")
        .select("*")
        .eq("tenant_id", currentTenantId as number)
        .order("section", { ascending: true })
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;

      return (data ?? []).map(mapFieldRow);
    },
    queryKey: configuracoesQueryKeys.closingForm(currentTenantId),
  });
};

export const useCreateClosingFormField = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      fieldType,
      label,
      required,
      section,
    }: {
      fieldType: ClosingFormFieldType;
      label: string;
      required: boolean;
      section: ClosingFormSection;
    }) => {
      if (!currentTenantId || !user) throw new Error("Sessao ou tenant atual indisponivel.");

      const customKey = `custom_${crypto.randomUUID()}`;

      const { error } = await supabase.from("tenant_closing_form_fields").insert({
        created_by: user.id,
        field_key: customKey,
        field_type: fieldType,
        is_system: false,
        label,
        required,
        section,
        tenant_id: currentTenantId,
        updated_by: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: configuracoesQueryKeys.closingForm(currentTenantId),
      });
    },
  });
};

export const useUpdateClosingFormField = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      active,
      fieldId,
      label,
      required,
    }: {
      active?: boolean;
      fieldId: string;
      label?: string;
      required?: boolean;
    }) => {
      if (!currentTenantId || !user) throw new Error("Sessao ou tenant atual indisponivel.");

      const payload: Record<string, unknown> = { updated_by: user.id };
      if (active !== undefined) payload.active = active;
      if (required !== undefined) payload.required = required;
      if (label !== undefined) payload.label = label;

      const { error } = await supabase
        .from("tenant_closing_form_fields")
        .update(payload)
        .eq("tenant_id", currentTenantId)
        .eq("id", Number(fieldId));

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: configuracoesQueryKeys.closingForm(currentTenantId),
      });
    },
  });
};

export const useDeleteClosingFormField = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();

  return useMutation({
    mutationFn: async (fieldId: string) => {
      if (!currentTenantId) throw new Error("Tenant atual indisponivel.");

      const { error } = await supabase
        .from("tenant_closing_form_fields")
        .delete()
        .eq("tenant_id", currentTenantId)
        .eq("id", Number(fieldId))
        .eq("is_system", false);

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: configuracoesQueryKeys.closingForm(currentTenantId),
      });
    },
  });
};
