-- Parâmetros editáveis dos modelos de contrato (dados bancários, capacidade, multas etc.)

alter table public.tenant_contract_module_settings
  add column if not exists template_params jsonb not null default '{}'::jsonb;

comment on column public.tenant_contract_module_settings.template_params is
  'Parâmetros do espaço usados na renderização dos modelos de contrato (capacidade, dados bancários, prazos comerciais).';
