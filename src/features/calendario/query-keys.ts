export const calendarioQueryKeys = {
  all: (tenantId: number | null, unitId: number | null = null, includeAllUnits = false) =>
    ["calendario", tenantId, unitId, includeAllUnits] as const,
  month: (
    tenantId: number | null,
    unitId: number | null,
    includeAllUnits: boolean,
    year: number,
    month: number,
  ) => ["calendario", tenantId, unitId, includeAllUnits, "month", year, month] as const,
};
