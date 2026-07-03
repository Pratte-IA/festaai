-- Reparo idempotente: garante name_automacao após restore do projeto Supabase.

create or replace function public.normalize_package_automation_name(raw_name text)
returns text
language sql
immutable
as $$
  select nullif(
    trim(both '_' from regexp_replace(
      regexp_replace(
        regexp_replace(
          trim(
            translate(
              lower(trim(coalesce(raw_name, ''))),
              'áàâãäéèêëíìîïóòôõöúùûüçñ',
              'aaaaaeeeeiiiiooooouuuucn'
            )
          ),
          '^pacote\s+',
          '',
          'i'
        ),
        '[^a-z0-9]+',
        '_',
        'g'
      ),
      '_+',
      '_',
      'g'
    )),
    ''
  );
$$;

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tenant_packages'
      and column_name = 'name_automacao'
  ) then
    alter table public.tenant_packages add column name_automacao text;
  end if;
end $$;

with base as (
  select
    id,
    tenant_id,
    public.normalize_package_automation_name(name) as base_key
  from public.tenant_packages
  where name_automacao is null or btrim(name_automacao) = ''
),
numbered as (
  select
    id,
    coalesce(nullif(base_key, ''), 'pacote') as base_key,
    row_number() over (
      partition by tenant_id, coalesce(nullif(base_key, ''), 'pacote')
      order by id
    ) as rn
  from base
)
update public.tenant_packages tp
set name_automacao = case
  when n.rn = 1 then n.base_key
  else n.base_key || '_' || n.rn::text
end
from numbered n
where tp.id = n.id;

update public.tenant_packages
set name_automacao = 'pacote_' || id::text
where name_automacao is null or btrim(name_automacao) = '';

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tenant_packages'
      and column_name = 'name_automacao'
      and is_nullable = 'YES'
  ) then
    alter table public.tenant_packages
      alter column name_automacao set not null;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tenant_packages_name_automacao_format_check'
  ) then
    alter table public.tenant_packages
      add constraint tenant_packages_name_automacao_format_check
      check (name_automacao ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$');
  end if;
end $$;

create unique index if not exists tenant_packages_tenant_name_automacao_key
  on public.tenant_packages (tenant_id, name_automacao);

comment on column public.tenant_packages.name_automacao is
  'Identificador estável para automações (sem acentos, snake_case, sem prefixo Pacote).';

drop function if exists public.normalize_package_automation_name(text);
