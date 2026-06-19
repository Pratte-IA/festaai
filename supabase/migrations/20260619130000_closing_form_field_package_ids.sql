-- Vincula campos personalizados do formulário aos pacotes em que devem aparecer

alter table public.tenant_closing_form_fields
  add column if not exists package_ids bigint[] not null default '{}';

create index if not exists tenant_closing_form_fields_package_ids_idx
  on public.tenant_closing_form_fields using gin (package_ids);
