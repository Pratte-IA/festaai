-- Pacotes aos quais cada adicional pode ser aplicado (vazio = todos os pacotes)

alter table public.tenant_additionals
  add column if not exists package_ids bigint[] not null default '{}';

create index if not exists tenant_additionals_package_ids_idx
  on public.tenant_additionals using gin (package_ids);
