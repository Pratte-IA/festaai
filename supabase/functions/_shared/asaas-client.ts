export type AsaasPayment = {
  bankSlipUrl?: string | null;
  billingType?: string;
  dueDate?: string | null;
  id: string;
  invoiceUrl?: string | null;
  status?: string;
  subscription?: string | null;
  value?: number | null;
};

export type AsaasPixQrCode = {
  encodedImage?: string;
  expirationDate?: string;
  payload?: string;
};

export type AsaasIdentificationField = {
  barCode?: string;
  identificationField?: string;
  nossoNumero?: string;
};

export type AsaasSubscription = {
  id: string;
  invoiceUrl?: string | null;
};

export type AsaasPaymentList = {
  data?: AsaasPayment[];
};

const requiredEnv = (key: string) => {
  const value = Deno.env.get(key);
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const asaasRequest = async <T>(path: string, options: RequestInit = {}) => {
  const apiUrl = Deno.env.get("ASAAS_API_URL") ?? "https://sandbox.asaas.com/api/v3";
  const apiKey = requiredEnv("ASAAS_API_KEY");

  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      access_token: apiKey,
      ...(options.headers ?? {}),
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.errors?.[0]?.description ?? "Erro ao comunicar com o Asaas.";
    throw new Error(message);
  }

  return payload as T;
};

export const resolveBoletoUrl = (payment: AsaasPayment | null | undefined) =>
  payment?.bankSlipUrl ?? payment?.invoiceUrl ?? null;

export const resolvePaymentCheckoutUrl = (payment: AsaasPayment | null | undefined) => {
  if (!payment) return null;
  if (payment.billingType === "BOLETO") {
    return resolveBoletoUrl(payment);
  }
  return payment.invoiceUrl ?? payment.bankSlipUrl ?? null;
};

export const isBoletoPayment = (payment: AsaasPayment | null | undefined) =>
  payment?.billingType === "BOLETO";

export const fetchPaymentPixQrCode = (paymentId: string) =>
  asaasRequest<AsaasPixQrCode>(`/payments/${paymentId}/pixQrCode`, { method: "GET" });

export const fetchPaymentIdentificationField = (paymentId: string) =>
  asaasRequest<AsaasIdentificationField>(`/payments/${paymentId}/identificationField`, {
    method: "GET",
  });

export const fetchPayment = (paymentId: string) =>
  asaasRequest<AsaasPayment>(`/payments/${paymentId}`, { method: "GET" });

export const fetchSubscriptionPayments = (subscriptionId: string) =>
  asaasRequest<AsaasPaymentList>(
    `/payments?subscription=${encodeURIComponent(subscriptionId)}&limit=10&order=desc`,
    { method: "GET" },
  );

export const addMonths = (date: Date, months: number) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next.toISOString().slice(0, 10);
};
