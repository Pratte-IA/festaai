-- Ofertas comerciais: canal de cobrança negociado (ex.: PIX direto, sem Asaas).

alter table public.commercial_offers
  add column if not exists billing_channel text not null default 'asaas',
  add column if not exists setup_payment_methods text,
  add column if not exists subscription_payment_methods text;

alter table public.commercial_offers
  drop constraint if exists commercial_offers_billing_channel_check;

alter table public.commercial_offers
  add constraint commercial_offers_billing_channel_check
  check (billing_channel in ('asaas', 'manual'));

alter table public.billing_customers
  drop constraint if exists billing_customers_provider_check;

alter table public.billing_customers
  add constraint billing_customers_provider_check
  check (provider in ('asaas', 'stripe', 'manual'));

alter table public.billing_subscriptions
  drop constraint if exists billing_subscriptions_provider_check;

alter table public.billing_subscriptions
  add constraint billing_subscriptions_provider_check
  check (provider in ('asaas', 'stripe', 'manual'));

drop function if exists public.get_public_commercial_offer(text);

create or replace function public.get_public_commercial_offer(p_token text)
returns table (
  id bigint,
  token text,
  name text,
  base_plan_slug text,
  monthly_price numeric,
  setup_price numeric,
  setup_installments integer,
  loyalty_months integer,
  recipient_company text,
  recipient_email text,
  expires_at timestamptz,
  billing_channel text,
  setup_payment_methods text,
  subscription_payment_methods text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    o.id,
    o.token,
    o.name,
    o.base_plan_slug,
    o.monthly_price,
    o.setup_price,
    o.setup_installments,
    o.loyalty_months,
    o.recipient_company,
    o.recipient_email,
    o.expires_at,
    o.billing_channel,
    o.setup_payment_methods,
    o.subscription_payment_methods
  from public.commercial_offers o
  where o.token = p_token
    and o.status = 'active'
    and o.expires_at > now()
  limit 1;
$$;

revoke all on function public.get_public_commercial_offer(text) from public;
grant execute on function public.get_public_commercial_offer(text) to anon, authenticated;

comment on column public.commercial_offers.billing_channel is
  'asaas = checkout automático; manual = forma de pagamento negociada fora do Asaas.';
