-- Configuração guiada: perfil da empresa e progresso das etapas

create table if not exists public.tenant_company_profiles (
  tenant_id bigint primary key references public.tenants(id) on delete cascade,
  company_name text,
  cnpj text,
  address_cep text,
  address_street text,
  address_number text,
  address_complement text,
  address_neighborhood text,
  address_city text,
  address_state text,
  legal_representative_name text,
  legal_representative_cpf text,
  completed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenant_guided_setup_progress (
  tenant_id bigint primary key references public.tenants(id) on delete cascade,
  current_step text not null default 'company_profile',
  completed_steps text[] not null default '{}',
  completed_at timestamptz,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint tenant_guided_setup_progress_current_step_check
    check (current_step in (
      'company_profile',
      'packages',
      'estrutura',
      'financeiro',
      'contrato',
      'checklist',
      'whatsapp',
      'completed'
    ))
);

drop trigger if exists set_tenant_company_profiles_updated_at on public.tenant_company_profiles;
create trigger set_tenant_company_profiles_updated_at
before update on public.tenant_company_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_tenant_guided_setup_progress_updated_at on public.tenant_guided_setup_progress;
create trigger set_tenant_guided_setup_progress_updated_at
before update on public.tenant_guided_setup_progress
for each row execute function public.set_updated_at();

alter table public.tenant_company_profiles enable row level security;
alter table public.tenant_guided_setup_progress enable row level security;

drop policy if exists "tenant_company_profiles_select_tenant_member" on public.tenant_company_profiles;
create policy "tenant_company_profiles_select_tenant_member"
on public.tenant_company_profiles
for select to authenticated
using (public.is_tenant_member(tenant_id));

drop policy if exists "tenant_company_profiles_insert_tenant_admin" on public.tenant_company_profiles;
create policy "tenant_company_profiles_insert_tenant_admin"
on public.tenant_company_profiles
for insert to authenticated
with check (public.has_tenant_role(tenant_id, array['owner', 'admin']));

drop policy if exists "tenant_company_profiles_update_tenant_admin" on public.tenant_company_profiles;
create policy "tenant_company_profiles_update_tenant_admin"
on public.tenant_company_profiles
for update to authenticated
using (public.has_tenant_role(tenant_id, array['owner', 'admin']))
with check (public.has_tenant_role(tenant_id, array['owner', 'admin']));

drop policy if exists "tenant_guided_setup_progress_select_tenant_member" on public.tenant_guided_setup_progress;
create policy "tenant_guided_setup_progress_select_tenant_member"
on public.tenant_guided_setup_progress
for select to authenticated
using (public.is_tenant_member(tenant_id));

drop policy if exists "tenant_guided_setup_progress_insert_tenant_admin" on public.tenant_guided_setup_progress;
create policy "tenant_guided_setup_progress_insert_tenant_admin"
on public.tenant_guided_setup_progress
for insert to authenticated
with check (public.has_tenant_role(tenant_id, array['owner', 'admin']));

drop policy if exists "tenant_guided_setup_progress_update_tenant_admin" on public.tenant_guided_setup_progress;
create policy "tenant_guided_setup_progress_update_tenant_admin"
on public.tenant_guided_setup_progress
for update to authenticated
using (public.has_tenant_role(tenant_id, array['owner', 'admin']))
with check (public.has_tenant_role(tenant_id, array['owner', 'admin']));

-- Tenants existentes já concluíram a configuração guiada
insert into public.tenant_guided_setup_progress (tenant_id, current_step, completed_steps, completed_at)
select
  t.id,
  'completed',
  array[
    'company_profile',
    'packages',
    'estrutura',
    'financeiro',
    'contrato',
    'checklist',
    'whatsapp'
  ]::text[],
  now()
from public.tenants t
on conflict (tenant_id) do nothing;

create or replace function public.seed_tenant_guided_setup_progress()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.tenant_guided_setup_progress (tenant_id, current_step, completed_steps)
  values (new.id, 'company_profile', '{}')
  on conflict (tenant_id) do nothing;

  return new;
end;
$$;

drop trigger if exists seed_guided_setup_on_tenant_create on public.tenants;
create trigger seed_guided_setup_on_tenant_create
after insert on public.tenants
for each row execute function public.seed_tenant_guided_setup_progress();
