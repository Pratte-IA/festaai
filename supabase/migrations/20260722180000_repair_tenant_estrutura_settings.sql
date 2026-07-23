-- A migration create_tenant_estrutura_settings foi marcada como aplicada, mas a tabela
-- sumiu do banco FestaAI (PostgREST PGRST205 / HTTP 404). Recria de forma idempotente
-- e reseed a partir da estrutura já salva nos pacotes.

create table if not exists public.tenant_estrutura_settings (
  tenant_id bigint primary key references public.tenants (id) on delete cascade,
  estrutura jsonb not null default '{"brinquedos":[],"espaco":[],"decoracao":[]}'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now (),
  updated_at timestamptz not null default now ()
);

comment on table public.tenant_estrutura_settings is
  'Estrutura global da festa (brinquedos, espaco, decoracao); aplicada aos pacotes do tenant.';

insert into public.tenant_estrutura_settings (tenant_id, estrutura, created_at, updated_at)
select
  seeded.tenant_id,
  seeded.estrutura,
  now (),
  now ()
from (
  select
    tenant_id,
    estrutura,
    row_number () over (partition by tenant_id order by id) as rn
  from public.tenant_packages
  where
    estrutura is not null
    and jsonb_typeof(estrutura) = 'object'
    and jsonb_typeof(estrutura -> 'brinquedos') = 'array'
    and jsonb_array_length(estrutura -> 'brinquedos') > 0
) seeded
where
  seeded.rn = 1
on conflict (tenant_id) do nothing;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where
      tgname = 'set_tenant_estrutura_settings_updated_at'
      and tgrelid = 'public.tenant_estrutura_settings'::regclass
  ) then
    create trigger set_tenant_estrutura_settings_updated_at
    before update on public.tenant_estrutura_settings
    for each row
    execute function public.set_updated_at ();
  end if;
end
$$;

alter table public.tenant_estrutura_settings enable row level security;

drop policy if exists "tenant_estrutura_settings_members_all" on public.tenant_estrutura_settings;
create policy "tenant_estrutura_settings_members_all"
on public.tenant_estrutura_settings for all to authenticated
using (public.is_tenant_member (tenant_id))
with check (public.is_tenant_member (tenant_id));

drop policy if exists "tenant_estrutura_settings_select_platform_admin" on public.tenant_estrutura_settings;
create policy "tenant_estrutura_settings_select_platform_admin"
on public.tenant_estrutura_settings
for select
to authenticated
using (public.is_platform_admin ());
