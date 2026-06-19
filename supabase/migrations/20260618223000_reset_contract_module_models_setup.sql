-- Exigir configuracao explicita dos modelos (nao herdar do aceite de termos)

update public.tenant_contract_module_settings
set
  models_configured_at = null,
  default_template_key = null,
  updated_at = now();

delete from public.tenant_contract_module_settings
where models_configured_at is null;
