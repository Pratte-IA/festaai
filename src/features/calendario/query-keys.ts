export const calendarioQueryKeys = {
  all: (tenantId: number | null) => ["calendario", tenantId] as const,
  month: (tenantId: number | null, year: number, month: number) =>
    ["calendario", tenantId, "month", year, month] as const,
};
