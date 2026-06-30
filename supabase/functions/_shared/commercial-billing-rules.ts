export interface CommercialBillingRule {
  loyalty_months: number | null;
  monthly_price: number;
  name: string;
  setup_billing_type: "CREDIT_CARD" | "UNDEFINED";
  setup_installments: number | null;
  setup_payment_methods: string;
  setup_price: number;
  subscription_billing_type: "UNDEFINED";
  subscription_max_payments: number | null;
  subscription_payment_methods: string;
}

export const COMMERCIAL_BILLING_RULES: Record<string, CommercialBillingRule> = {
  avista: {
    loyalty_months: null,
    monthly_price: 750,
    name: "À vista",
    setup_billing_type: "UNDEFINED",
    setup_installments: 1,
    setup_payment_methods: "Pix, boleto ou cartão de crédito (1x)",
    setup_price: 2200,
    subscription_billing_type: "UNDEFINED",
    subscription_max_payments: null,
    subscription_payment_methods: "Boleto ou cartão de crédito recorrente",
  },
  fidelidade: {
    loyalty_months: 12,
    monthly_price: 650,
    name: "Fidelidade",
    setup_billing_type: "CREDIT_CARD",
    setup_installments: 6,
    setup_payment_methods: "Cartão de crédito em até 6x (você escolhe menos se quiser)",
    setup_price: 2000,
    subscription_billing_type: "UNDEFINED",
    subscription_max_payments: 12,
    subscription_payment_methods: "12 parcelas de R$ 650 (R$ 7.800) — boleto ou cartão",
  },
  parcelado: {
    loyalty_months: null,
    monthly_price: 750,
    name: "Parcelado",
    setup_billing_type: "CREDIT_CARD",
    setup_installments: 6,
    setup_payment_methods: "Cartão de crédito em até 6x (você escolhe menos se quiser)",
    setup_price: 2500,
    subscription_billing_type: "UNDEFINED",
    subscription_max_payments: null,
    subscription_payment_methods: "Boleto ou cartão de crédito recorrente",
  },
};

export const resolveCommercialBillingRule = (
  planSlug: string,
  overrides?: Partial<CommercialBillingRule>,
): CommercialBillingRule | null => {
  const base = COMMERCIAL_BILLING_RULES[planSlug];
  if (!base) return null;
  return { ...base, ...overrides };
};
