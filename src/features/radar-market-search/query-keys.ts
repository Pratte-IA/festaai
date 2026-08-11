export const radarMarketSearchQueryKeys = {
  root: ["admin", "radar-market-search"] as const,
  coverage: () => [...radarMarketSearchQueryKeys.root, "coverage"] as const,
  terms: (segment: string) =>
    [...radarMarketSearchQueryKeys.root, "terms", segment.trim()] as const,
  runs: (limit: number) => [...radarMarketSearchQueryKeys.root, "runs", limit] as const,
};
