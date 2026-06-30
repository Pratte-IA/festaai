export const billingQueryKeys = {
  all: ["billing"] as const,
  plans: () => [...billingQueryKeys.all, "plans"] as const,
  publicCheckout: (externalReference?: string | null) =>
    [...billingQueryKeys.all, "public-checkout", externalReference] as const,
  paymentDetails: (externalReference?: string | null, paymentKind?: string | null) =>
    [...billingQueryKeys.all, "payment-details", externalReference, paymentKind] as const,
  subscription: (tenantId: number | null) => [...billingQueryKeys.all, "subscription", tenantId] as const,
};
