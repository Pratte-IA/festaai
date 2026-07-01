import { Tables } from "@/lib/supabase/database.types";

export type SubscriptionPlan = Tables<"subscription_plans">;
export type BillingCustomer = Tables<"billing_customers">;
export type BillingSubscription = Tables<"billing_subscriptions">;

export interface CheckoutRequest {
  companyName: string;
  contractAccepted: true;
  contractVersion: string;
  cpfCnpj: string;
  email: string;
  message?: string;
  name: string;
  offerToken?: string | null;
  phone: string;
  planSlug: string;
  tenantId?: number | null;
}

export interface CheckoutResponse {
  checkoutUrl: string | null;
  externalReference: string;
  maxSetupInstallments: number;
  monthlyPrice: number;
  planName: string;
  setupPrice: number;
  status: string;
  subscriptionId: number;
}

export interface CreateSetupPaymentRequest {
  externalReference: string;
  setupInstallments: number;
}

export interface CreateSetupPaymentResponse {
  checkoutUrl: string | null;
  setupInstallments: number;
  setupInstallmentValue: number;
  setupPrice: number;
}

export interface PublicCheckoutStatus {
  checkoutPhase: CheckoutPhase;
  checkoutUrl: string | null;
  externalReference: string;
  maxSetupInstallments: number;
  monthlyPrice: number | null;
  planName: string | null;
  selectedSetupInstallments: number | null;
  setupInstallmentValue: number | null;
  setupPaymentId: string | null;
  setupPaymentMethods: string | null;
  setupPrice: number | null;
  status: string;
  subscriptionCommitmentTotal: number | null;
  subscriptionMaxPayments: number | null;
  subscriptionPaymentId: string | null;
  subscriptionPaymentMethods: string | null;
  tenantId: number | null;
}

export type CheckoutPhase =
  | "setup_pending"
  | "setup_paid"
  | "subscription_pending"
  | "completed";

export type PaymentKind = "setup" | "subscription";

export interface PaymentCheckoutDetails {
  billingType: string;
  boleto: {
    barCode?: string;
    identificationField?: string;
  } | null;
  invoiceUrl: string | null;
  paymentId: string;
  paymentKind: PaymentKind;
  paymentStatus: string;
  pixQrCode: {
    encodedImage?: string;
    expirationDate?: string;
    payload?: string;
  } | null;
}

export interface ActivateSubscriptionCheckoutResponse {
  checkoutPhase: CheckoutPhase;
  checkoutUrl: string | null;
  paymentId: string | null;
  subscriptionPaymentId: string | null;
}

export interface PayWithCreditCardRequest {
  creditCard: {
    ccv: string;
    expiryMonth: string;
    expiryYear: string;
    holderName: string;
    number: string;
  };
  externalReference: string;
  holderCpfCnpj?: string;
  paymentKind: PaymentKind;
}

export interface PayWithCreditCardResponse {
  paymentId: string;
  paymentKind: PaymentKind;
  paymentStatus: string;
}
