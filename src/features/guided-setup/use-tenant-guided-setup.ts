import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import { useAuth } from "@/features/auth";
import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

import { deriveGuidedSetupState } from "./derive-guided-setup-state";
import {
  getActiveGuidedSetupStep,
  getNextGuidedSetupStep,
  isGuidedSetupComplete,
  isGuidedSetupStepKey,
  type GuidedSetupStepKey,
} from "./guided-setup-steps";
import { guidedSetupQueryKeys } from "./query-keys";
import type { TenantGuidedSetupProgress } from "./types";

type ProgressRow = {
  completed_at: string | null;
  completed_steps: string[] | null;
  current_step: string;
  tenant_id: number;
};

const mapProgressRow = (row: ProgressRow): TenantGuidedSetupProgress => {
  const completedSteps = (row.completed_steps ?? []).filter(isGuidedSetupStepKey);

  return {
    completedAt: row.completed_at,
    completedSteps,
    currentStep:
      row.current_step === "completed"
        ? "completed"
        : isGuidedSetupStepKey(row.current_step)
          ? row.current_step
          : "company_profile",
    tenantId: row.tenant_id,
  };
};

export const useTenantGuidedSetupProgress = () => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(currentTenantId),
    queryFn: async (): Promise<TenantGuidedSetupProgress | null> => {
      const { data, error } = await supabase
        .from("tenant_guided_setup_progress")
        .select("tenant_id, current_step, completed_steps, completed_at")
        .eq("tenant_id", currentTenantId as number)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return mapProgressRow(data as ProgressRow);
    },
    queryKey: guidedSetupQueryKeys.progress(currentTenantId),
  });
};

export const useDerivedGuidedSetupState = () => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(currentTenantId),
    queryFn: async () => deriveGuidedSetupState(currentTenantId as number),
    queryKey: guidedSetupQueryKeys.derived(currentTenantId),
  });
};

export const useIsGuidedSetupComplete = () => {
  const derivedQuery = useDerivedGuidedSetupState();
  const progressQuery = useTenantGuidedSetupProgress();

  const merged = useMemo(() => {
    if (!derivedQuery.data) return null;

    const explicitCompleted = progressQuery.data?.completedSteps ?? [];
    const completedSteps = Array.from(
      new Set([...derivedQuery.data.completedSteps, ...explicitCompleted]),
    ) as GuidedSetupStepKey[];

    return {
      activeStep: getActiveGuidedSetupStep(completedSteps),
      completedSteps,
      isComplete: isGuidedSetupComplete(completedSteps),
    };
  }, [derivedQuery.data, progressQuery.data?.completedSteps]);

  return {
    ...derivedQuery,
    isLoading: derivedQuery.isLoading || progressQuery.isLoading,
    error: derivedQuery.error ?? progressQuery.error,
    data: merged,
    isComplete: Boolean(merged?.isComplete),
    activeStep: merged?.activeStep ?? null,
    completedSteps: merged?.completedSteps ?? [],
  };
};

interface CompleteGuidedSetupStepInput {
  stepKey: GuidedSetupStepKey;
}

export const useCompleteGuidedSetupStep = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ stepKey }: CompleteGuidedSetupStepInput) => {
      if (!currentTenantId || !user) {
        throw new Error("Sessão ou tenant atual indisponível.");
      }

      const { data: existing, error: existingError } = await supabase
        .from("tenant_guided_setup_progress")
        .select("tenant_id, current_step, completed_steps, completed_at")
        .eq("tenant_id", currentTenantId)
        .maybeSingle();

      if (existingError) throw existingError;

      const currentCompleted = (existing?.completed_steps ?? []).filter(isGuidedSetupStepKey);
      const completedSteps = Array.from(new Set([...currentCompleted, stepKey]));
      const nextStep = getNextGuidedSetupStep(completedSteps);
      const allComplete = isGuidedSetupComplete(completedSteps);
      const now = new Date().toISOString();

      const payload = {
        completed_at: allComplete ? now : null,
        completed_steps: completedSteps,
        current_step: allComplete ? "completed" : (nextStep ?? "completed"),
        tenant_id: currentTenantId,
        updated_by: user.id,
      };

      if (existing) {
        const { data, error } = await supabase
          .from("tenant_guided_setup_progress")
          .update(payload)
          .eq("tenant_id", currentTenantId)
          .select("tenant_id, current_step, completed_steps, completed_at")
          .single();

        if (error) throw error;
        return mapProgressRow(data as ProgressRow);
      }

      const { data, error } = await supabase
        .from("tenant_guided_setup_progress")
        .insert(payload)
        .select("tenant_id, current_step, completed_steps, completed_at")
        .single();

      if (error) throw error;
      return mapProgressRow(data as ProgressRow);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: guidedSetupQueryKeys.progress(currentTenantId),
      });
      void queryClient.invalidateQueries({
        queryKey: guidedSetupQueryKeys.derived(currentTenantId),
      });
    },
  });
};

interface ReopenGuidedSetupStepInput {
  stepKey: GuidedSetupStepKey;
}

export const useReopenGuidedSetupStep = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ stepKey }: ReopenGuidedSetupStepInput) => {
      if (!currentTenantId || !user) {
        throw new Error("Sessão ou tenant atual indisponível.");
      }

      const { data: existing, error: existingError } = await supabase
        .from("tenant_guided_setup_progress")
        .select("tenant_id, current_step, completed_steps, completed_at")
        .eq("tenant_id", currentTenantId)
        .maybeSingle();

      if (existingError) throw existingError;
      if (!existing) return null;

      const completedSteps = (existing.completed_steps ?? [])
        .filter(isGuidedSetupStepKey)
        .filter((key) => key !== stepKey);

      const { data, error } = await supabase
        .from("tenant_guided_setup_progress")
        .update({
          completed_at: null,
          completed_steps: completedSteps,
          current_step: stepKey,
          updated_by: user.id,
        })
        .eq("tenant_id", currentTenantId)
        .select("tenant_id, current_step, completed_steps, completed_at")
        .single();

      if (error) throw error;
      return mapProgressRow(data as ProgressRow);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: guidedSetupQueryKeys.progress(currentTenantId),
      });
      void queryClient.invalidateQueries({
        queryKey: guidedSetupQueryKeys.derived(currentTenantId),
      });
    },
  });
};
