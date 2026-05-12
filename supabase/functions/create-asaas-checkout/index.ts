import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const checkoutSchema = z.object({
  companyName: z.string().min(2).max(120),
  email: z.string().email(),
  message: z.string().max(1000).optional().nullable(),
  name: z.string().min(2).max(120),
  phone: z.string().min(8).max(30),
  planSlug: z.string().min(2).max(60),
  tenantId: z.number().int().positive().optional().nullable(),
});

/** Condições comerciais na página /contratar (valores alinhados ao frontend). Se não houver linha no DB com o mesmo slug, usamos um plano ativo como FK e estes valores no Asaas. */
const COMMERCIAL_CONDITIONS: Record<
  string,
  {
    monthly_price: number;
    setup_price: number;
    setup_installments: number | null;
    loyalty_months: number | null;
    name: string;
  }
> = {
  avista: {
    monthly_price: 750,
    setup_price: 2200,
    setup_installments: 1,
    loyalty_months: null,
    name: "À vista",
  },
  parcelado: {
    monthly_price: 750,
    setup_price: 2500,
    setup_installments: 6,
    loyalty_months: null,
    name: "Parcelado",
  },
  fidelidade: {
    monthly_price: 650,
    setup_price: 2000,
    setup_installments: 6,
    loyalty_months: 12,
    name: "Fidelidade",
  },
};

type AsaasCustomer = {
  id: string;
};

type AsaasSubscription = {
  id: string;
  invoiceUrl?: string | null;
};

type AsaasPaymentList = {
  data?: Array<{ invoiceUrl?: string | null; bankSlipUrl?: string | null }>;
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
      templateKey: "billing_checkout_started",
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

    const condition = COMMERCIAL_CONDITIONS[input.planSlug];

    const { data: planInitial, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("slug", input.planSlug)
      .eq("active", true)
      .maybeSingle();

    if (planError) throw planError;

    let plan = planInitial;

    if (!plan) {
      if (!condition) {
        return jsonResponse({ error: "Plano indisponível." }, 404);
      }
      const { data: fallback, error: fbErr } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("active", true)
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (fbErr) throw fbErr;
      if (!fallback) return jsonResponse({ error: "Plano indisponível." }, 404);
      plan = {
        ...fallback,
        ...condition,
        slug: input.planSlug,
        id: fallback.id,
      };
    } else if (condition) {
      plan = { ...plan, ...condition, id: plan.id };
    }

    const customer = await asaasRequest<AsaasCustomer>("/customers", {
      body: JSON.stringify({
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
        metadata: { message: input.message, requester_name: input.name },
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
    const externalReference = `festaai:${crypto.randomUUID()}`;

    const subscription = await asaasRequest<AsaasSubscription>("/subscriptions", {
      body: JSON.stringify({
        billingType: "UNDEFINED",
        customer: customer.id,
        cycle: "MONTHLY",
        description: `FestaAI - Plano ${plan.name}`,
        externalReference,
        nextDueDate: nextDueDateISO,
        value: plan.monthly_price,
      }),
      method: "POST",
    });

    const payments = await asaasRequest<AsaasPaymentList>(`/subscriptions/${subscription.id}/payments`).catch(() => null);
    const checkoutUrl =
      subscription.invoiceUrl ??
      payments?.data?.[0]?.invoiceUrl ??
      payments?.data?.[0]?.bankSlipUrl ??
      null;

    const { data: billingSubscription, error: subscriptionError } = await supabase
      .from("billing_subscriptions")
      .insert({
        checkout_url: checkoutUrl,
        customer_id: billingCustomer.id,
        external_reference: externalReference,
        metadata: {
          asaas_customer_id: customer.id,
          setup_price: plan.setup_price,
          condition_slug: input.planSlug,
        },
        next_due_date: nextDueDateISO,
        plan_id: plan.id,
        provider: "asaas",
        provider_subscription_id: subscription.id,
        status: "pending",
        tenant_id: input.tenantId ?? null,
      })
      .select("id, status, checkout_url")
      .single();

    if (subscriptionError) throw subscriptionError;

    await sendBillingEmail(supabaseUrl, serviceRoleKey, {
      email: input.email,
      name: input.name,
      planName: plan.name,
      tenantId: input.tenantId ?? null,
    });

    return jsonResponse({
      checkoutUrl: billingSubscription.checkout_url,
      status: billingSubscription.status,
      subscriptionId: billingSubscription.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado ao criar checkout.";
    return jsonResponse({ error: message }, 400);
  }
});
