export type PaymentMethodType =
  | "pix"
  | "cartao_credito"
  | "cartao_debito"
  | "dinheiro"
  | "boleto"
  | "transferencia"
  | "outro";

export interface TenantPaymentMethod {
  active: boolean;
  allowedForDeposit: boolean;
  allowedForRemainingBalance: boolean;
  allowsInstallments: boolean;
  feeFixed: number | null;
  feePercentage: number | null;
  id: string;
  maxInstallments: number | null;
  name: string;
  notes: string | null;
  paymentType: PaymentMethodType;
  sortOrder: number;
}

export type TenantPaymentMethodInput = Omit<TenantPaymentMethod, "id">;

export const paymentMethodTypeLabels: Record<PaymentMethodType, string> = {
  boleto: "Boleto",
  cartao_credito: "Cartão de crédito",
  cartao_debito: "Cartão de débito",
  dinheiro: "Dinheiro",
  outro: "Outro",
  pix: "Pix",
  transferencia: "Transferência",
};

export const defaultPaymentMethodInput = (): TenantPaymentMethodInput => ({
  active: true,
  allowedForDeposit: true,
  allowedForRemainingBalance: true,
  allowsInstallments: false,
  feeFixed: null,
  feePercentage: null,
  maxInstallments: null,
  name: "",
  notes: null,
  paymentType: "pix",
  sortOrder: 0,
});

/** Tipos não oferecidos ao cliente para pagamento do saldo restante. */
export const EXCLUDED_BALANCE_PAYMENT_TYPES = new Set<PaymentMethodType>(["boleto"]);

export const isEligibleBalancePaymentMethod = (
  method: Pick<TenantPaymentMethod, "allowedForRemainingBalance" | "paymentType">,
): boolean =>
  method.allowedForRemainingBalance &&
  !EXCLUDED_BALANCE_PAYMENT_TYPES.has(method.paymentType);

export const filterBalancePaymentMethods = <
  T extends Pick<TenantPaymentMethod, "allowedForRemainingBalance" | "paymentType">,
>(
  methods: T[],
): T[] => methods.filter(isEligibleBalancePaymentMethod);
