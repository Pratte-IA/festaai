import { useQuery } from "@tanstack/react-query";

import {
  buildHolidayLookup,
  checkTenantHolidays,
  normalizeHolidayDateKey,
} from "./check-tenant-holidays";

export const useCheckTenantHolidays = (
  tenantId: number | null | undefined,
  dates: Array<string | null | undefined>,
) => {
  const normalizedDates = [
    ...new Set(
      dates
        .map((date) => (date ? normalizeHolidayDateKey(date) : null))
        .filter((date): date is string => Boolean(date)),
    ),
  ].sort();

  const query = useQuery({
    enabled: Boolean(tenantId) && normalizedDates.length > 0,
    queryFn: () => checkTenantHolidays(tenantId as number, normalizedDates),
    queryKey: ["holidays", "check", tenantId, normalizedDates.join("|")],
    staleTime: 60_000,
  });

  const lookup = buildHolidayLookup(query.data ?? []);

  return {
    ...query,
    getResult: lookup.getResult,
    isHoliday: lookup.isHoliday,
    isHolidayReady: !tenantId || normalizedDates.length === 0 || query.isSuccess,
  };
};
