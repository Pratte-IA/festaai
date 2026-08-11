import { useQuery } from "@tanstack/react-query";

import { fetchMunicipalitiesByUf } from "@/lib/brazil-cities";

export const brazilMunicipalitiesQueryKey = (uf: string) =>
  ["brazil-municipalities", uf.trim().toUpperCase()] as const;

export const useBrazilMunicipalities = (uf: string) => {
  const normalizedUf = uf.trim().toUpperCase();

  return useQuery({
    enabled: normalizedUf.length === 2,
    queryKey: brazilMunicipalitiesQueryKey(normalizedUf),
    queryFn: () => fetchMunicipalitiesByUf(normalizedUf),
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24,
  });
};
