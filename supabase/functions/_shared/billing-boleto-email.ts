import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

import { AsaasPayment, resolveBoletoUrl } from "./asaas-client.ts";
import { sendTransactionalEmail } from "./send-transactional-email.ts";

interface BillingCustomer {
  email?: string | null;
  name?: string | null;
}

interface SendBoletoIssuedEmailInput {
  chargeLabel: string;
  dueDate?: string | null;
  payment: AsaasPayment;
  subscriptionId: number;
  tenantId?: number | null;
}

const formatDueDate = (value?: string | null) => {
  if (!value) return "conforme indicado no boleto";
  const date = new Date(`${value}T12:00:00`);
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
};

const formatBRL = (value?: number | null) => {
  if (value == null) return null;
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const wasBoletoEmailSent = async (
  supabase: SupabaseClient,
  subscriptionId: number,
  paymentId: string,
) => {
  const { count } = await supabase
    .from("email_events")
    .select("id", { count: "exact", head: true })
    .eq("template_key", "billing_boleto_issued")
    .eq("status", "sent")
    .contains("metadata", { asaas_payment_id: paymentId, billing_subscription_id: subscriptionId });

  return (count ?? 0) > 0;
};

export const sendBoletoIssuedEmailIfNeeded = async (
  supabase: SupabaseClient,
  supabaseUrl: string,
  serviceRoleKey: string,
  customer: BillingCustomer | null | undefined,
  input: SendBoletoIssuedEmailInput,
) => {
  const boletoUrl = resolveBoletoUrl(input.payment);
  if (!boletoUrl || !customer?.email) {
    return { sent: false, reason: "missing_boleto_url_or_email" as const };
  }

  if (await wasBoletoEmailSent(supabase, input.subscriptionId, input.payment.id)) {
    return { sent: false, reason: "already_sent" as const };
  }

  const recipientName = customer.name?.trim() || "Cliente FestaAI";
  const amountLabel = formatBRL(input.payment.value);

  await sendTransactionalEmail(supabaseUrl, serviceRoleKey, {
    metadata: {
      asaas_payment_id: input.payment.id,
      billing_subscription_id: input.subscriptionId,
      trigger: "boleto_issued",
    },
    params: {
      amountLabel,
      boletoUrl,
      chargeLabel: input.chargeLabel,
      ctaLabel: "Abrir boleto e pagar",
      ctaUrl: boletoUrl,
      dueDate: formatDueDate(input.dueDate ?? input.payment.dueDate),
      name: recipientName,
    },
    recipient: {
      email: customer.email,
      name: recipientName,
    },
    templateKey: "billing_boleto_issued",
    tenantId: input.tenantId ?? null,
  });

  return { sent: true, boletoUrl };
};

export const buildBoletoEmailParams = (boletoUrl: string | null, name: string, dueDate?: string) => ({
  boletoUrl,
  checkoutUrl: boletoUrl,
  ctaLabel: boletoUrl ? "Abrir boleto e pagar" : "Acessar o FestaAI",
  ctaUrl: boletoUrl ?? undefined,
  dueDate: dueDate ? formatDueDate(dueDate) : undefined,
  name,
});
