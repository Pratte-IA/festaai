create table public.tenant_estrutura_settings (
  tenant_id bigint primary key references public.tenants (id) on delete cascade,
  estrutura jsonb not null default '{"brinquedos":[],"espaco":[],"decoracao":[]}'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now (),
  updated_at timestamptz not null default now ()
);

comment on table public.tenant_estrutura_settings is 'Estrutura global da festa (brinquedos, espaço, decoração); aplicada aos pacotes do tenant.';

insert into public.tenant_estrutura_settings (tenant_id, estrutura, created_at, updated_at)
select tenant_id, estrutura, now (), now ()
from (
  select tenant_id, estrutura, row_number () over (partition by tenant_id order by id) as rn
  from public.tenant_packages
) seeded
where
  rn = 1
on conflict (tenant_id) do nothing;

create trigger set_tenant_estrutura_settings_updated_at
before update on public.tenant_estrutura_settings
for each row
execute function public.set_updated_at ();

alter table public.tenant_estrutura_settings enable row level security;

create policy "tenant_estrutura_settings_members_all"
on public.tenant_estrutura_settings for all to authenticated using (public.is_tenant_member (tenant_id))
with check (public.is_tenant_member (tenant_id));

create policy "tenant_estrutura_settings_select_platform_admin"
on public.tenant_estrutura_settings
for select
to authenticated
using (public.is_platform_admin());
