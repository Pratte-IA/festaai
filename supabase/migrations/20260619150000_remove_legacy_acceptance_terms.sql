-- Remove aceites legados redundantes (já cobertos pelo corpo do contrato)

delete from public.evento_acceptance_responses
where term_id in (
  select id
  from public.tenant_acceptance_terms
  where term_key in (
    'politica_cancelamento',
    'politica_remarcacao',
    'regras_espaco',
    'horarios_contratados',
    'itens_inclusos'
  )
);

delete from public.tenant_acceptance_terms
where term_key in (
  'politica_cancelamento',
  'politica_remarcacao',
  'regras_espaco',
  'horarios_contratados',
  'itens_inclusos'
);
