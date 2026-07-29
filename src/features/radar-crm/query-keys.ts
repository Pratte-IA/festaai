import type { RadarCrmFilters } from "./types";

export const radarCrmQueryKeys = {
  root: ["admin", "radar-crm"] as const,
  list: (filters: RadarCrmFilters) => [...radarCrmQueryKeys.root, "list", filters] as const,
  detail: (companyId: number | null) => [...radarCrmQueryKeys.root, "detail", companyId] as const,
  filterOptions: () => [...radarCrmQueryKeys.root, "filter-options"] as const,
};
