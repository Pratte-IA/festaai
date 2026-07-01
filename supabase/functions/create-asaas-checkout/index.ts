import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

import { addMonths } from "../_shared/asaas-client.ts";
import {
  buildCommercialContractPackage,
  COMMERCIAL_CONTRACT_VERSION,
} from "../_shared/commercial-contract-v1.ts";
import { resolveCommercialBillingRule } from "../_shared/commercial-billing-rules.ts";
import { resolveClientIp, resolveUserAgent } from "../_shared/resolve-client-ip.ts";

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const checkoutSchema = z.object({
  companyName: z.string().min(2).max(120),
  contractAccepted: z.literal(true),
  contractVersion: z.string().min(4).max(40),
  cpfCnpj: z.string().min(11).max(18),
  email: z.string().email(),
  message: z.string().max(1000).optional().nullable(),
  name: z.string().min(2).max(120),
  offerToken: z.string().min(8).max(120).optional().nullable(),
  phone: z.string().min(8).max(30),
  planSlug: z.string().min(2).max(60),
  tenantId: z.number().int().positive().optional().nullable(),
});

type CommercialOfferRow = {
  base_plan_slug: string;
  expires_at: string;
  id: number;
  loyalty_months: number | null;
  monthly_price: number;
  name: string;
  setup_installments: number | null;
  setup_price: number;
  status: string;
  token: string;
};

/** Condições comerciais alinhadas ao frontend e às regras de cobrança Asaas. */
const buildCommercialCondition = (
  planSlug: string,
  offer?: CommercialOfferRow | null,
) => {
  const rule = resolveCommercialBillingRule(planSlug);
  if (!rule) return null;

  if (!offer) return rule;

  return resolveCommercialBillingRule(planSlug, {
    loyalty_months: offer.loyalty_months,
    monthly_price: Number(offer.monthly_price),
    name: offer.name,
    setup_installments: offer.setup_installments,
    setup_price: Number(offer.setup_price),
  });
};

type AsaasCustomer = {
  id: string;
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });

const requiredEnv = (key: string) => {
  const value = Deno.env.get(key);
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const asaasRequest = async <T>(path: string, options: RequestInit = {}) => {
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

const sendBillingEmail = async (
  supabaseUrl: string,
  serviceRoleKey: string,
  payload: {
    email: string;
    name: string;
    planName: string;
    tenantId?: number | null;
  },
) => {
  await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
    body: JSON.stringify({
      params: {
        name: payload.name,
        planName: payload.planName,
      },
      recipient: {
        email: payload.email,
        name: payload.name,
      },
      templateKey: "welcome",
      tenantId: payload.tenantId ?? null,
    }),
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
    },
    method: "POST",
  }).catch(() => null);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = requiredEnv("SUPABASE_URL");
    const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const input = checkoutSchema.parse(await req.json());

    if (input.contractVersion !== COMMERCIAL_CONTRACT_VERSION) {
      return jsonResponse(
        { error: "Versão do contrato desatualizada. Recarregue a página e tente novamente." },
        409,
      );
    }

    let commercialOffer: CommercialOfferRow | null = null;

    if (input.offerToken) {
      const { data: offer, error: offerError } = await supabase
        .from("commercial_offers")
        .select("*")
        .eq("token", input.offerToken)
        .maybeSingle();

      if (offerError) throw offerError;

      if (!offer || offer.status !== "active") {
        return jsonResponse({ error: "Esta proposta não está mais disponível." }, 404);
      }

      if (new Date(offer.expires_at).getTime() <= Date.now()) {
        await supabase.from("commercial_offers").update({ status: "expired" }).eq("id", offer.id);
        return jsonResponse({ error: "Esta proposta expirou." }, 410);
      }

      commercialOffer = offer as CommercialOfferRow;

      if (input.planSlug !== commercialOffer.base_plan_slug) {
        return jsonResponse({ error: "Plano incompatível com a proposta." }, 400);
      }
    }

    const planSlug = commercialOffer?.base_plan_slug ?? input.planSlug;
    const condition = buildCommercialCondition(planSlug, commercialOffer);

    if (!condition) {
      return jsonResponse({ error: "Plano indisponível." }, 404);
    }

    const { data: planInitial, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("slug", planSlug)
      .eq("active", true)
      .maybeSingle();

    if (planError) throw planError;

    let plan = planInitial;

    if (!plan) {
      const { data: fallback, error: fbErr } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("active", true)
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (fbErr) throw fbErr;
      if (!fallback) return jsonResponse({ error: "Plano indisponível." }, 404);
      plan = { ...fallback, slug: planSlug, id: fallback.id };
    }

    const customer = await asaasRequest<AsaasCustomer>("/customers", {
      body: JSON.stringify({
        cpfCnpj: input.cpfCnpj.replace(/\D/g, ""),
        email: input.email,
        externalReference: input.tenantId ? `tenant:${input.tenantId}` : undefined,
        name: input.companyName,
        mobilePhone: input.phone.replace(/\D/g, ""),
        notificationDisabled: false,
      }),
      method: "POST",
    });

    const { data: billingCustomer, error: customerError } = await supabase
      .from("billing_customers")
      .insert({
        company_name: input.companyName,
        email: input.email,
        metadata: {
          cpf_cnpj: input.cpfCnpj.replace(/\D/g, ""),
          message: input.message,
          requester_name: input.name,
        },
        name: input.name,
        phone: input.phone,
        provider: "asaas",
        provider_customer_id: customer.id,
        tenant_id: input.tenantId ?? null,
      })
      .select("*")
      .single();

    if (customerError) throw customerError;

    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 1);
    const nextDueDateISO = nextDueDate.toISOString().slice(0, 10);
    const firstMonthlyDueDateISO = addMonths(nextDueDate, 1);
    const externalReference = `festaai:${crypto.randomUUID()}`;
    const maxSetupInstallments = Math.max(1, Number(condition.setup_installments ?? 1));
    const setupPrice = Number(condition.setup_price);
    const monthlyPrice = Number(condition.monthly_price);
    const subscriptionMaxPayments = condition.subscription_max_payments;
    const loyaltyMonths = condition.loyalty_months;
    const subscriptionCommitmentTotal =
      subscriptionMaxPayments != null ? monthlyPrice * subscriptionMaxPayments : null;

    const checkoutUrl = null;

    const { data: billingSubscription, error: subscriptionError } = await supabase
      .from("billing_subscriptions")
      .insert({
        checkout_url: checkoutUrl,
        customer_id: billingCustomer.id,
        external_reference: externalReference,
        metadata: {
          asaas_customer_id: customer.id,
          checkout_phase: "setup_pending",
          condition_slug: planSlug,
          loyalty_months: loyaltyMonths,
          max_setup_installments: maxSetupInstallments,
          monthly_price: monthlyPrice,
          plan_name: condition.name,
          setup_billing_type: condition.setup_billing_type,
          setup_external_reference: `${externalReference}:setup`,
          setup_installments: null,
          setup_payment_methods: condition.setup_payment_methods,
          setup_price: setupPrice,
          setup_provider_payment_id: null,
          subscription_billing_type: condition.subscription_billing_type,
          subscription_commitment_total: subscriptionCommitmentTotal,
          subscription_first_due_date: firstMonthlyDueDateISO,
          subscription_max_payments: subscriptionMaxPayments,
          subscription_payment_methods: condition.subscription_payment_methods,
          subscription_provider_payment_id: null,
          ...(commercialOffer
            ? { commercial_offer_id: commercialOffer.id, commercial_offer_token: commercialOffer.token }
            : {}),
        },
        next_due_date: firstMonthlyDueDateISO,
        plan_id: plan.id,
        provider: "asaas",
        provider_subscription_id: null,
        status: "pending",
        tenant_id: input.tenantId ?? null,
      })
      .select("id, status, checkout_url, external_reference")
      .single();

    if (subscriptionError) throw subscriptionError;

    const appUrl = (Deno.env.get("APP_URL") ?? "https://festaai.com.br").replace(/\/$/, "");
    const contractPackage = buildCommercialContractPackage(
      {
        basePlanSlug: planSlug,
        commercialOfferId: commercialOffer?.id ?? null,
        commercialOfferToken: commercialOffer?.token ?? null,
        conditionName: condition.name,
        contractReferenceId: externalReference,
        loyaltyMonths: loyaltyMonths,
        maxSetupInstallments,
        monthlyPrice,
        setupInstallments: maxSetupInstallments > 1 ? null : 1,
        setupPrice,
        subscriptionMaxPayments: subscriptionMaxPayments,
      },
      `${appUrl}/privacidade`,
    );

    const { error: acceptanceError } = await supabase.from("billing_contract_acceptances").insert({
      acceptance_declaration: contractPackage.acceptanceDeclaration,
      accepted_by_company: input.companyName,
      accepted_by_cpf_cnpj: input.cpfCnpj.replace(/\D/g, ""),
      accepted_by_email: input.email,
      accepted_by_name: input.name,
      billing_subscription_id: billingSubscription.id,
      commercial_annex_snapshot: contractPackage.commercialAnnex,
      commercial_snapshot: contractPackage.commercialSnapshot,
      contract_body_snapshot: contractPackage.contractBody,
      contract_version: contractPackage.contractVersion,
      external_reference: externalReference,
      ip_address: resolveClientIp(req),
      metadata: {
        checkout_phase: "setup_pending",
        user_agent: resolveUserAgent(req),
      },
      user_agent: resolveUserAgent(req),
    });

    if (acceptanceError) throw acceptanceError;

    if (commercialOffer) {
      const { error: offerUpdateError } = await supabase
        .from("commercial_offers")
        .update({
          billing_subscription_id: billingSubscription.id,
          status: "accepted",
        })
        .eq("id", commercialOffer.id)
        .eq("status", "active");

      if (offerUpdateError) throw offerUpdateError;
    }

    await sendBillingEmail(supabaseUrl, serviceRoleKey, {
      email: input.email,
      name: input.name,
      planName: plan.name,
      tenantId: input.tenantId ?? null,
    });

    return jsonResponse({
      checkoutUrl: billingSubscription.checkout_url,
      externalReference: billingSubscription.external_reference,
      maxSetupInstallments,
      monthlyPrice,
      planName: condition.name,
      setupPrice,
      status: billingSubscription.status,
      subscriptionId: billingSubscription.id,
      subscriptionMaxPayments,
      subscriptionCommitmentTotal,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado ao criar checkout.";
    return jsonResponse({ error: message }, 400);
  }
});
