alter table public.tenant_contract_module_acceptances
  add column if not exists accepted_by_cpf text;
