export const billingQueryKeys = {
  all: ["billing"] as const,
  plans: () => [...billingQueryKeys.all, "plans"] as const,
  subscription: (tenantId: number | null) => [...billingQueryKeys.all, "subscription", tenantId] as const,
};
