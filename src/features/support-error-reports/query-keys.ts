export const supportErrorReportsQueryKey = (tenantId: number | null) =>
  ["support-error-reports", tenantId] as const;
