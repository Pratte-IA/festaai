export const emailQueryKeys = {
  all: ["emails"] as const,
  events: (tenantId: number | null) => [...emailQueryKeys.all, "events", tenantId] as const,
};
