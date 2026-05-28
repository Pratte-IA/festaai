export type DownPaymentMode = "percentage" | "fixed";

export type DownPaymentMethod = "pix" | "cartao_credito" | "dinheiro" | "transferencia";

export type InstallmentLimitMode = "until_event_date" | "allow_future";

export interface FinancialSettings {
  default_down_payment_fixed_value: number | null;
  default_down_payment_percentage: number;
  down_payment_method: DownPaymentMethod;
  down_payment_mode: DownPaymentMode;
  installment_limit_mode: InstallmentLimitMode;
  max_installments: number;
  remaining_card_installments: boolean;
  remaining_due_before_event_enabled: boolean;
  remaining_due_days_before_event: number;
  remaining_pix_installments: boolean;
}

export const defaultFinancialSettings: FinancialSettings = {
  default_down_payment_fixed_value: null,
  default_down_payment_percentage: 30,
  down_payment_method: "pix",
  down_payment_mode: "percentage",
  installment_limit_mode: "until_event_date",
  max_installments: 3,
  remaining_card_installments: true,
  remaining_due_before_event_enabled: false,
  remaining_due_days_before_event: 7,
  remaining_pix_installments: true,
};

export const downPaymentMethodLabels: Record<DownPaymentMethod, string> = {
  cartao_credito: "Cartão de crédito",
  dinheiro: "Dinheiro",
  pix: "Pix",
  transferencia: "Transferência",
};

export const installmentLimitModeLabels: Record<InstallmentLimitMode, string> = {
  allow_future: "Aceita parcelas após a data da festa",
  until_event_date: "Limite máximo de parcelas até a data da festa",
};
