alter table public.tenant_financial_settings
  add column if not exists down_payment_mode text not null default 'percentage',
  add column if not exists default_down_payment_fixed_value numeric(12, 2),
  add column if not exists down_payment_method text not null default 'pix',
  add column if not exists remaining_pix_installments boolean not null default true,
  add column if not exists remaining_card_installments boolean not null default true,
  add column if not exists remaining_due_before_event_enabled boolean not null default false,
  add column if not exists remaining_due_days_before_event integer not null default 7,
  add column if not exists installment_limit_mode text not null default 'until_event_date';

alter table public.tenant_financial_settings
  drop constraint if exists tenant_financial_settings_values_check;

alter table public.tenant_financial_settings
  add constraint tenant_financial_settings_values_check check (
    default_down_payment_percentage >= 0
    and default_down_payment_percentage <= 100
    and max_installments >= 1
    and down_payment_mode in ('percentage', 'fixed')
    and (default_down_payment_fixed_value is null or default_down_payment_fixed_value >= 0)
    and down_payment_method in ('pix', 'cartao_credito', 'dinheiro', 'transferencia')
    and remaining_due_days_before_event >= 0
    and installment_limit_mode in ('until_event_date', 'allow_future')
    and (
      down_payment_mode = 'percentage'
      or default_down_payment_fixed_value is not null
    )
  );
