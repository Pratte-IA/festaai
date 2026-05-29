-- Fase H: validação pós-migration

\echo '=== Tabelas ==='
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'tenant_contract_templates',
    'evento_contracts',
    'evento_contract_acceptances'
  )
ORDER BY table_name;

\echo '=== Enum evento_contract_status ==='
SELECT e.enumlabel
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'evento_contract_status'
ORDER BY e.enumsortorder;

\echo '=== RLS ==='
SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN (
    'tenant_contract_templates',
    'evento_contracts',
    'evento_contract_acceptances'
  )
ORDER BY c.relname;

\echo '=== Policies ==='
SELECT tablename, policyname, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'tenant_contract_templates',
    'evento_contracts',
    'evento_contract_acceptances'
  )
ORDER BY tablename, policyname;

\echo '=== Template seeds ==='
SELECT tenant_id, name, is_default, is_active, version, char_length(template_html) AS html_len
FROM public.tenant_contract_templates
ORDER BY tenant_id;

\echo '=== Triggers ==='
SELECT tgname, tgrelid::regclass::text AS table_name
FROM pg_trigger
WHERE tgname IN (
  'seed_contract_template_on_tenant_create',
  'prevent_accepted_contract_content_mutation',
  'set_tenant_contract_templates_updated_at',
  'set_evento_contracts_updated_at'
)
AND NOT tgisinternal
ORDER BY tgname;
