import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FunctionsHttpError } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase/client";

import { radarMarketSearchQueryKeys } from "./query-keys";
import type {
  RadarMarketCoverage,
  RadarMarketSearchRun,
  RadarMarketSearchTerm,
  StartRadar00SearchInput,
  StartRadar00SearchResult,
} from "./types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asNumber = (value: unknown, fallback = 0) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const asString = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

const asNullableString = (value: unknown) => (typeof value === "string" ? value : null);

const parseCoverage = (value: unknown): RadarMarketCoverage | null => {
  if (!isRecord(value)) return null;
  const id = asNumber(value.id, NaN);
  if (!Number.isFinite(id)) return null;
  return {
    id,
    city: asString(value.city),
    state: asString(value.state),
    segment: asString(value.segment),
    companies_found: asNumber(value.companies_found),
    qualified_companies: asNumber(value.qualified_companies),
    disqualified_companies: asNumber(value.disqualified_companies),
    companies_with_contact: asNumber(value.companies_with_contact),
    companies_prospected: asNumber(value.companies_prospected),
    searches_executed: asNumber(value.searches_executed),
    searches_with_new_results: asNumber(value.searches_with_new_results),
    consecutive_zero_runs: asNumber(value.consecutive_zero_runs),
    coverage_status: asString(value.coverage_status, "open"),
    last_search_at: asNullableString(value.last_search_at),
    last_new_company_at: asNullableString(value.last_new_company_at),
    created_at: asString(value.created_at),
    updated_at: asString(value.updated_at),
  };
};

const parseTerm = (value: unknown): RadarMarketSearchTerm | null => {
  if (!isRecord(value)) return null;
  const id = asNumber(value.id, NaN);
  const searchTerm = asString(value.search_term);
  if (!Number.isFinite(id) || !searchTerm) return null;
  return {
    id,
    segment: asString(value.segment),
    search_term: searchTerm,
    priority: asNumber(value.priority, 100),
    is_active: value.is_active !== false,
  };
};

const parseRun = (value: unknown): RadarMarketSearchRun | null => {
  if (!isRecord(value)) return null;
  const id = asNumber(value.id, NaN);
  if (!Number.isFinite(id)) return null;
  return {
    id,
    city: asString(value.city),
    state: asString(value.state),
    segment: asString(value.segment),
    search_term: asString(value.search_term),
    provider: asString(value.provider),
    results_returned: asNumber(value.results_returned),
    unique_results: asNumber(value.unique_results),
    new_companies: asNumber(value.new_companies),
    duplicate_companies: asNumber(value.duplicate_companies),
    execution_status: asString(value.execution_status, "pending"),
    executed_at: asString(value.executed_at),
    metadata: isRecord(value.metadata) ? value.metadata : {},
  };
};

const resolveFunctionsError = async (error: unknown, fallback: string) => {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = (await error.context.json()) as { error?: string };
      if (body.error) return body.error;
    } catch {
      // Mantém fallback.
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

export const useRadarMarketCoverage = () =>
  useQuery({
    queryKey: radarMarketSearchQueryKeys.coverage(),
    queryFn: async (): Promise<RadarMarketCoverage[]> => {
      const { data, error } = await supabase.rpc("radar_list_market_coverage");
      if (error) throw error;
      if (!Array.isArray(data)) return [];
      return data.map(parseCoverage).filter((item): item is RadarMarketCoverage => item !== null);
    },
  });

export const fetchRadarMarketSearchTerms = async (
  segment: string,
): Promise<RadarMarketSearchTerm[]> => {
  const { data, error } = await supabase.rpc("radar_list_market_search_terms", {
    p_segment: segment.trim(),
  });
  if (error) throw error;
  if (!Array.isArray(data)) return [];
  return data.map(parseTerm).filter((item): item is RadarMarketSearchTerm => item !== null);
};

export const useRadarMarketSearchTerms = (segment: string) =>
  useQuery({
    enabled: segment.trim().length > 0,
    queryKey: radarMarketSearchQueryKeys.terms(segment),
    queryFn: () => fetchRadarMarketSearchTerms(segment),
  });

export const useRadarMarketSearchRuns = (limit = 40) =>
  useQuery({
    queryKey: radarMarketSearchQueryKeys.runs(limit),
    queryFn: async (): Promise<RadarMarketSearchRun[]> => {
      const { data, error } = await supabase.rpc("radar_list_market_search_runs", {
        p_limit: limit,
      });
      if (error) throw error;
      if (!Array.isArray(data)) return [];
      return data.map(parseRun).filter((item): item is RadarMarketSearchRun => item !== null);
    },
  });

export const useStartRadar00Search = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: StartRadar00SearchInput): Promise<StartRadar00SearchResult> => {
      const { data, error } = await supabase.functions.invoke<StartRadar00SearchResult>(
        "start-radar-00-search",
        {
          body: {
            search_name: input.search_name,
            city: input.city,
            state: input.state,
            segment: input.segment,
            search_terms: input.search_terms,
            max_results_per_term: input.max_results_per_term,
            notes: input.notes ?? null,
          },
        },
      );

      if (error) {
        throw new Error(await resolveFunctionsError(error, "Não foi possível iniciar a pesquisa."));
      }

      if (!data || typeof data !== "object") {
        throw new Error("Resposta inválida ao iniciar a pesquisa.");
      }

      if (!("ok" in data) || data.ok !== true) {
        const message =
          "error" in data && typeof data.error === "string" && data.error.trim()
            ? data.error
            : "Não foi possível iniciar a pesquisa.";
        throw new Error(message);
      }

      return data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: radarMarketSearchQueryKeys.coverage() }),
        queryClient.invalidateQueries({ queryKey: radarMarketSearchQueryKeys.root }),
      ]);
    },
  });
};
