-- Validação pós-migration Fase A

\echo '=== 1. Migration aplicada ==='
select version, name
from supabase_migrations.schema_migrations
where name like '%expand_contract_form%';

\echo '=== 2. Colunas de metadados em tenant_closing_form_fields ==='
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'tenant_closing_form_fields'
  and column_name in ('category', 'usage_contract', 'is_locked', 'config')
order by column_name;

\echo '=== 3. Campos sistema por tenant (esperado ~38, sem duplicidade de field_key) ==='
select
  t.id as tenant_id,
  t.name as tenant_name,
  count(f.id) as total_fields,
  count(f.id) filter (where f.is_system) as system_fields,
  count(distinct f.field_key) filter (where f.field_key is not null) as distinct_keys,
  count(f.id) filter (where f.field_key is not null) as keyed_fields
from public.tenants t
left join public.tenant_closing_form_fields f on f.tenant_id = t.id
group by t.id, t.name
order by t.id;

\echo '=== 3b. Duplicidades de field_key (deve ser vazio) ==='
select tenant_id, field_key, count(*) as cnt
from public.tenant_closing_form_fields
where field_key is not null
group by tenant_id, field_key
having count(*) > 1;

\echo '=== 3c. 14 campos originais presentes por tenant ==='
select
  t.id as tenant_id,
  count(f.id) filter (
    where f.field_key in (
      'cliente_nome', 'cliente_telefone', 'cliente_email',
      'aniversariante_nome', 'aniversariante_data_nascimento',
      'data_evento', 'hora_evento', 'quantidade_convidados', 'pacote_nome',
      'valor_pacote', 'valor_adicionais', 'valor_total', 'valor_entrada', 'observacoes'
    )
  ) as original_14_count
from public.tenants t
left join public.tenant_closing_form_fields f on f.tenant_id = t.id
group by t.id
having count(f.id) filter (
  where f.field_key in (
    'cliente_nome', 'cliente_telefone', 'cliente_email',
    'aniversariante_nome', 'aniversariante_data_nascimento',
    'data_evento', 'hora_evento', 'quantidade_convidados', 'pacote_nome',
    'valor_pacote', 'valor_adicionais', 'valor_total', 'valor_entrada', 'observacoes'
  )
) < 14;

\echo '=== 4. Métodos de pagamento por tenant (esperado 6) ==='
select
  t.id as tenant_id,
  t.name,
  count(pm.id) as payment_methods
from public.tenants t
left join public.tenant_payment_methods pm on pm.tenant_id = t.id
group by t.id, t.name
order by t.id;

\echo '=== 5. Aceites por tenant (esperado 8) ==='
select
  t.id as tenant_id,
  t.name,
  count(at.id) as acceptance_terms
from public.tenants t
left join public.tenant_acceptance_terms at on at.tenant_id = t.id
group by t.id, t.name
order by t.id;

\echo '=== 6. Seção financeiro remanescente (deve ser 0) ==='
select count(*) as financeiro_rows
from public.tenant_closing_form_fields
where section = 'financeiro';

\echo '=== 7. RLS policies novas tabelas ==='
select schemaname, tablename, policyname, cmd
from pg_policies
where tablename in ('tenant_payment_methods', 'tenant_acceptance_terms', 'evento_acceptance_responses')
order by tablename, policyname;
