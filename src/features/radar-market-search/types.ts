export type RadarCoverageStatus =
  | "open"
  | "expanding"
  | "near_exhaustion"
  | "exhausted"
  | "monitoring";

export type RadarRunExecutionStatus = "pending" | "running" | "completed" | "failed";

export interface RadarMarketCoverage {
  id: number;
  city: string;
  state: string;
  segment: string;
  companies_found: number;
  qualified_companies: number;
  disqualified_companies: number;
  companies_with_contact: number;
  companies_prospected: number;
  searches_executed: number;
  searches_with_new_results: number;
  consecutive_zero_runs: number;
  coverage_status: RadarCoverageStatus | string;
  last_search_at: string | null;
  last_new_company_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RadarMarketSearchTerm {
  id: number;
  segment: string;
  search_term: string;
  priority: number;
  is_active: boolean;
}

export interface RadarMarketSearchRun {
  id: number;
  city: string;
  state: string;
  segment: string;
  search_term: string;
  provider: string;
  results_returned: number;
  unique_results: number;
  new_companies: number;
  duplicate_companies: number;
  execution_status: RadarRunExecutionStatus | string;
  executed_at: string;
  metadata: Record<string, unknown>;
}

export interface Radar00SearchPayload {
  search_name: string;
  state: string;
  city: string;
  segment: string;
  search_terms: string[];
  max_results_per_term: number;
  notes: string | null;
  source: "festaai_admin";
}

export interface StartRadar00SearchInput {
  search_name: string;
  state: string;
  city: string;
  segment: string;
  search_terms: string[];
  max_results_per_term: number;
  notes?: string | null;
}

export interface StartRadar00SearchResult {
  ok: true;
  batch_id: string;
  coverage_id: number;
  run_ids: number[];
  payload: Radar00SearchPayload;
  webhook_configured: boolean;
  webhook_dispatched: boolean;
  webhook_status: number | null;
  webhook_error: string | null;
}
