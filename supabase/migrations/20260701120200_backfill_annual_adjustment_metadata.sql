-- Preenche datas de reajuste anual para assinaturas ativas que ainda não possuem metadados.

update public.billing_subscriptions bs
set metadata = coalesce(bs.metadata, '{}'::jsonb) || jsonb_strip_nulls(
  jsonb_build_object(
    'current_monthly_price',
      coalesce(
        nullif(bs.metadata->>'current_monthly_price', '')::numeric,
        nullif(bs.metadata->>'monthly_price', '')::numeric
      ),
    'next_annual_adjustment_at',
      case
        when bs.metadata ? 'next_annual_adjustment_at' then bs.metadata->>'next_annual_adjustment_at'
        when bs.metadata ? 'subscription_paid_at' then
          to_char((bs.metadata->>'subscription_paid_at')::timestamptz + interval '1 year', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
        else null
      end,
    'next_annual_adjustment_notice_at',
      case
        when bs.metadata ? 'next_annual_adjustment_notice_at' then bs.metadata->>'next_annual_adjustment_notice_at'
        when bs.metadata ? 'subscription_paid_at' then
          to_char((bs.metadata->>'subscription_paid_at')::timestamptz + interval '1 year' - interval '30 days', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
        else null
      end,
    'contract_anniversary_at',
      coalesce(
        bs.metadata->>'contract_anniversary_at',
        bs.metadata->>'subscription_paid_at'
      )
  )
)
where bs.status = 'active'
  and bs.provider_subscription_id is not null
  and (
    not (bs.metadata ? 'next_annual_adjustment_at')
    or bs.metadata->>'next_annual_adjustment_at' is null
    or bs.metadata->>'next_annual_adjustment_at' = ''
  )
  and bs.metadata ? 'subscription_paid_at';

comment on table public.billing_subscription_adjustments is
  'Histórico de reajustes anuais (IPCA) aplicados às mensalidades via Asaas.';
