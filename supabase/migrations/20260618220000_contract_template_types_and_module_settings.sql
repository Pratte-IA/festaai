-- Tipos de contrato (aluguel / festa completa) e configuração inicial do módulo

alter table public.tenant_contract_templates
  add column if not exists template_key text;

update public.tenant_contract_templates
set template_key = 'aluguel_espaco_festa_completa'
where template_key is null;

alter table public.tenant_contract_templates
  alter column template_key set not null;

alter table public.tenant_contract_templates
  drop constraint if exists tenant_contract_templates_key_check;

alter table public.tenant_contract_templates
  add constraint tenant_contract_templates_key_check
  check (template_key in ('aluguel_espaco', 'aluguel_espaco_festa_completa'));

create unique index if not exists tenant_contract_templates_tenant_key_idx
  on public.tenant_contract_templates (tenant_id, template_key);

insert into public.tenant_contract_templates (
  tenant_id,
  template_key,
  name,
  description,
  template_html,
  version,
  is_active,
  is_default
)
select
  t.id,
  'aluguel_espaco',
  'Contrato de Aluguel do Espaço',
  'Modelo para locação do espaço sem pacote de festa completa.',
  $html$<article class="contract-document">
<h1>CONTRATO DE ALUGUEL DO ESPAÇO</h1>
<p><strong>Nº:</strong> {{contract_number}}</p>
<p>Modelo base FestaAI — o conteúdo definitivo será disponibilizado em breve.</p>
<p><strong>CONTRATANTE:</strong> {{cliente_nome}}, CPF {{cliente_cpf}}</p>
<p><strong>Data do evento:</strong> {{data_evento}} · <strong>Horário:</strong> {{hora_evento}}</p>
<p><strong>Valor total:</strong> {{valor_total}}</p>
</article>$html$,
  1,
  false,
  false
from public.tenants t
where not exists (
  select 1
  from public.tenant_contract_templates ct
  where ct.tenant_id = t.id
    and ct.template_key = 'aluguel_espaco'
);

update public.tenant_contract_templates
set
  name = 'Contrato de Aluguel do Espaço + Festa Completa',
  description = 'Modelo para locação do espaço com pacote e serviços de festa completa.'
where template_key = 'aluguel_espaco_festa_completa'
  and name = 'Contrato padrão de festa infantil';

create table if not exists public.tenant_contract_module_settings (
  tenant_id bigint primary key references public.tenants(id) on delete cascade,
  models_configured_at timestamptz,
  default_template_key text,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint tenant_contract_module_settings_default_key_check
    check (
      default_template_key is null
      or default_template_key in ('aluguel_espaco', 'aluguel_espaco_festa_completa')
    )
);

drop trigger if exists set_tenant_contract_module_settings_updated_at
  on public.tenant_contract_module_settings;

create trigger set_tenant_contract_module_settings_updated_at
before update on public.tenant_contract_module_settings
for each row execute function public.set_updated_at();

alter table public.tenant_contract_module_settings enable row level security;

drop policy if exists "tenant_contract_module_settings_select_tenant_member"
  on public.tenant_contract_module_settings;
create policy "tenant_contract_module_settings_select_tenant_member"
on public.tenant_contract_module_settings
for select to authenticated
using (public.is_tenant_member(tenant_id));

drop policy if exists "tenant_contract_module_settings_insert_tenant_admin"
  on public.tenant_contract_module_settings;
create policy "tenant_contract_module_settings_insert_tenant_admin"
on public.tenant_contract_module_settings
for insert to authenticated
with check (public.has_tenant_role(tenant_id, array['owner', 'admin']));

drop policy if exists "tenant_contract_module_settings_update_tenant_admin"
  on public.tenant_contract_module_settings;
create policy "tenant_contract_module_settings_update_tenant_admin"
on public.tenant_contract_module_settings
for update to authenticated
using (public.has_tenant_role(tenant_id, array['owner', 'admin']))
with check (public.has_tenant_role(tenant_id, array['owner', 'admin']));

create or replace function public.seed_tenant_contract_template()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.tenant_contract_templates (
    tenant_id, template_key, name, description, template_html, version, is_active, is_default
  )
  values
    (
      new.id,
      'aluguel_espaco',
      'Contrato de Aluguel do Espaço',
      'Modelo para locação do espaço sem pacote de festa completa.',
      $espaco$<article class="contract-document">
<h1>CONTRATO DE ALUGUEL DO ESPAÇO</h1>
<p><strong>Nº:</strong> {{contract_number}}</p>
<p>Modelo base FestaAI — o conteúdo definitivo será disponibilizado em breve.</p>
<p><strong>CONTRATANTE:</strong> {{cliente_nome}}, CPF {{cliente_cpf}}</p>
<p><strong>Data do evento:</strong> {{data_evento}} · <strong>Horário:</strong> {{hora_evento}}</p>
<p><strong>Valor total:</strong> {{valor_total}}</p>
</article>$espaco$,
      1,
      false,
      false
    ),
    (
      new.id,
      'aluguel_espaco_festa_completa',
      'Contrato de Aluguel do Espaço + Festa Completa',
      'Modelo para locação do espaço com pacote e serviços de festa completa.',
      $festa$<article class="contract-document">
<h1>CONTRATO DE ALUGUEL DO ESPAÇO + FESTA COMPLETA</h1>
<p><strong>Nº:</strong> {{contract_number}}</p>
<p>Modelo base FestaAI — o conteúdo definitivo será disponibilizado em breve.</p>
<p><strong>CONTRATANTE:</strong> {{cliente_nome}}, CPF {{cliente_cpf}}</p>
<p><strong>Data da festa:</strong> {{data_evento}} · <strong>Horário:</strong> {{hora_evento}}</p>
<p><strong>Pacote:</strong> {{pacote_nome}} · <strong>Valor total:</strong> {{valor_total}}</p>
</article>$festa$,
      1,
      false,
      false
    )
  on conflict (tenant_id, template_key) do nothing;

  return new;
end;
$$;
