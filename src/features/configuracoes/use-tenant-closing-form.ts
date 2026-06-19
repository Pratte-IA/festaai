import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";
import { Json } from "@/lib/supabase/database.types";

import {
  ClosingFormField,
  ClosingFormFieldCategory,
  ClosingFormFieldType,
  ClosingFormFieldUpdatePayload,
  ClosingFormFieldUsage,
  ClosingFormSection,
} from "./closing-form-types";
import { configuracoesQueryKeys } from "./query-keys";

const mapPackageIds = (packageIds: number[] | null | undefined): string[] =>
  (packageIds ?? []).map(String);

const serializePackageIds = (packageIds: string[] | undefined): number[] =>
  (packageIds ?? []).map(Number).filter((id) => Number.isFinite(id) && id > 0);

const mapFieldRow = (row: {
  active: boolean;
  category?: string;
  config?: Record<string, unknown> | null;
  description?: string | null;
  field_key: string | null;
  field_type: string;
  id: number;
  is_locked?: boolean;
  is_system: boolean;
  label: string;
  package_ids?: number[] | null;
  required: boolean;
  section: string;
  sort_order: number;
  usage_ai?: boolean;
  usage_checklist?: boolean;
  usage_contract?: boolean;
  usage_internal_task?: boolean;
  usage_party_summary?: boolean;
  usage_reports?: boolean;
}): ClosingFormField => ({
  active: row.active,
  category: (row.category ?? "operacional") as ClosingFormFieldCategory,
  config: (row.config ?? {}) as Record<string, unknown>,
  description: row.description ?? null,
  fieldKey: row.field_key,
  fieldType: row.field_type as ClosingFormFieldType,
  id: String(row.id),
  isLocked: row.is_locked ?? false,
  isSystem: row.is_system,
  label: row.label,
  packageIds: mapPackageIds(row.package_ids),
  required: row.required,
  section: row.section as ClosingFormSection,
  sortOrder: row.sort_order,
  usage: {
    ai: row.usage_ai ?? false,
    checklist: row.usage_checklist ?? false,
    contract: row.usage_contract ?? false,
    internalTask: row.usage_internal_task ?? false,
    partySummary: row.usage_party_summary ?? false,
    reports: row.usage_reports ?? false,
  },
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
      category = "operacional",
      config,
      description,
      fieldType,
      label,
      packageIds,
      required = false,
      section,
      usage,
    }: {
      category?: ClosingFormFieldCategory;
      config?: Record<string, unknown>;
      description?: string;
      fieldType: ClosingFormFieldType;
      label: string;
      packageIds?: string[];
      required?: boolean;
      section: ClosingFormSection;
      usage?: Partial<ClosingFormFieldUsage>;
    }) => {
      if (!currentTenantId || !user) throw new Error("Sessao ou tenant atual indisponivel.");

      const { data: sectionFields, error: sortError } = await supabase
        .from("tenant_closing_form_fields")
        .select("sort_order")
        .eq("tenant_id", currentTenantId)
        .eq("section", section)
        .order("sort_order", { ascending: false })
        .limit(1);

      if (sortError) throw sortError;

      const nextSortOrder = (sectionFields?.[0]?.sort_order ?? 0) + 1;
      const customKey = `custom_${crypto.randomUUID()}`;

      const { data, error } = await supabase
        .from("tenant_closing_form_fields")
        .insert({
          category,
          config: (config ?? {}) as Json,
          created_by: user.id,
          description: description?.trim() || null,
          field_key: customKey,
          field_type: fieldType,
          is_system: false,
          label: label.trim(),
          package_ids: serializePackageIds(packageIds),
          required,
          section,
          sort_order: nextSortOrder,
          tenant_id: currentTenantId,
          updated_by: user.id,
          usage_ai: usage?.ai ?? false,
          usage_checklist: usage?.checklist ?? false,
          usage_contract: usage?.contract ?? false,
          usage_internal_task: usage?.internalTask ?? false,
          usage_party_summary: usage?.partySummary ?? false,
          usage_reports: usage?.reports ?? false,
        })
        .select()
        .single();

      if (error) throw error;

      return mapFieldRow(data);
    },
    onSuccess: (createdField) => {
      queryClient.setQueryData<ClosingFormField[]>(
        configuracoesQueryKeys.closingForm(currentTenantId),
        (previous) => {
          if (!previous) return [createdField];
          if (previous.some((field) => field.id === createdField.id)) return previous;
          return [...previous, createdField];
        },
      );
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
      category,
      config,
      description,
      fieldId,
      fieldType,
      label,
      packageIds,
      required,
      section,
      usage,
    }: ClosingFormFieldUpdatePayload) => {
      if (!currentTenantId || !user) throw new Error("Sessao ou tenant atual indisponivel.");

      const payload: Record<string, unknown> = { updated_by: user.id };
      if (active !== undefined) payload.active = active;
      if (required !== undefined) payload.required = required;
      if (label !== undefined) payload.label = label;
      if (packageIds !== undefined) payload.package_ids = serializePackageIds(packageIds);
      if (description !== undefined) payload.description = description;
      if (fieldType !== undefined) payload.field_type = fieldType;
      if (section !== undefined) payload.section = section;
      if (category !== undefined) payload.category = category;
      if (config !== undefined) payload.config = config as Json;

      if (usage) {
        if (usage.ai !== undefined) payload.usage_ai = usage.ai;
        if (usage.checklist !== undefined) payload.usage_checklist = usage.checklist;
        if (usage.contract !== undefined) payload.usage_contract = usage.contract;
        if (usage.internalTask !== undefined) payload.usage_internal_task = usage.internalTask;
        if (usage.partySummary !== undefined) payload.usage_party_summary = usage.partySummary;
        if (usage.reports !== undefined) payload.usage_reports = usage.reports;
      }

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

export const useReorderClosingFormField = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      direction,
      fieldId,
    }: {
      direction: "down" | "up";
      fieldId: string;
    }) => {
      if (!currentTenantId || !user) throw new Error("Sessao ou tenant atual indisponivel.");

      const { data: currentField, error: fieldError } = await supabase
        .from("tenant_closing_form_fields")
        .select("id, section, sort_order")
        .eq("tenant_id", currentTenantId)
        .eq("id", Number(fieldId))
        .single();

      if (fieldError) throw fieldError;

      const { data: sectionFields, error: listError } = await supabase
        .from("tenant_closing_form_fields")
        .select("id, sort_order")
        .eq("tenant_id", currentTenantId)
        .eq("section", currentField.section)
        .order("sort_order", { ascending: true })
        .order("id", { ascending: true });

      if (listError) throw listError;

      const rows = sectionFields ?? [];
      const currentIndex = rows.findIndex((row) => row.id === currentField.id);
      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

      if (currentIndex < 0 || targetIndex < 0 || targetIndex >= rows.length) return;

      const neighbor = rows[targetIndex];

      const { error: firstError } = await supabase
        .from("tenant_closing_form_fields")
        .update({ sort_order: neighbor.sort_order, updated_by: user.id })
        .eq("tenant_id", currentTenantId)
        .eq("id", currentField.id);

      if (firstError) throw firstError;

      const { error: secondError } = await supabase
        .from("tenant_closing_form_fields")
        .update({ sort_order: currentField.sort_order, updated_by: user.id })
        .eq("tenant_id", currentTenantId)
        .eq("id", neighbor.id);

      if (secondError) throw secondError;
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
