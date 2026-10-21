-- O índice antigo permitia um único modelo padrão por tenant.
-- Com matriz e filial, cada casa precisa do próprio contrato padrão.

drop index if exists public.tenant_contract_templates_default_idx;

create unique index if not exists tenant_contract_templates_unit_default_idx
  on public.tenant_contract_templates (unit_id)
  where is_default = true;
