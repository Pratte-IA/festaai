-- Simplifica seções Aniversariante e Dados da festa no formulário de contratação.

delete from public.tenant_closing_form_fields
where field_key in (
  'aniversariante_tema',
  'aniversariante_personagem',
  'hora_termino',
  'quantidade_adultos',
  'quantidade_crianas',
  'observacoes_festa'
);

update public.tenant_closing_form_fields
set sort_order = 3
where field_key = 'quantidade_convidados';

update public.tenant_contract_templates
set template_html = replace(template_html, ' às {{hora_termino}}', '')
where template_html like '%{{hora_termino}}%';

update public.tenant_contract_templates
set template_html = replace(
  template_html,
  ' (adultos: {{quantidade_adultos}}, crianças: {{quantidade_crianas}})',
  ''
)
where template_html like '%{{quantidade_adultos}}%';

update public.tenant_contract_templates
set template_html = replace(
  template_html,
  E'  <li><strong>Tema:</strong> {{aniversariante_tema}}</li>\n',
  ''
)
where template_html like '%{{aniversariante_tema}}%';

update public.tenant_contract_templates
set template_html = replace(template_html, E'<p>{{observacoes_festa}}</p>\n', '')
where template_html like '%{{observacoes_festa}}%';

create or replace function public.seed_tenant_closing_form_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.tenant_closing_form_fields (
    tenant_id, section, label, field_key, field_type, required, active, sort_order, is_system,
    category, is_locked, usage_contract, usage_party_summary, usage_ai, usage_reports
  )
  values
    (new.id, 'cliente', 'Nome completo', 'cliente_nome', 'text', true, true, 1, true, 'contratual', true, true, true, true, true),
    (new.id, 'cliente', 'Telefone', 'cliente_telefone', 'phone', true, true, 2, true, 'contratual', true, true, true, true, false),
    (new.id, 'cliente', 'E-mail', 'cliente_email', 'email', false, true, 3, true, 'contratual', false, true, false, true, false),
    (new.id, 'cliente', 'CPF', 'cliente_cpf', 'text', true, true, 4, true, 'contratual', true, true, true, true, true),
    (new.id, 'cliente', 'CEP', 'cliente_cep', 'text', true, true, 5, true, 'contratual', false, true, true, false, false),
    (new.id, 'cliente', 'Rua', 'cliente_rua', 'text', true, true, 6, true, 'contratual', false, true, true, false, false),
    (new.id, 'cliente', 'Número', 'cliente_numero', 'text', true, true, 7, true, 'contratual', false, true, true, false, false),
    (new.id, 'cliente', 'Bairro', 'cliente_bairro', 'text', true, true, 8, true, 'contratual', false, true, true, false, false),
    (new.id, 'cliente', 'Cidade', 'cliente_cidade', 'text', true, true, 9, true, 'contratual', false, true, true, false, false),
    (new.id, 'cliente', 'Estado', 'cliente_estado', 'text', true, true, 10, true, 'contratual', false, true, true, false, false),
    (new.id, 'aniversariante', 'Nome do aniversariante', 'aniversariante_nome', 'text', true, true, 1, true, 'operacional', true, false, true, true, true),
    (new.id, 'aniversariante', 'Data de nascimento', 'aniversariante_data_nascimento', 'date', true, true, 2, true, 'operacional', true, false, true, true, false),
    (new.id, 'festa', 'Data da festa', 'data_evento', 'date', true, true, 1, true, 'operacional', true, true, true, true, true),
    (new.id, 'festa', 'Horário de início', 'hora_evento', 'time', true, true, 2, true, 'operacional', true, true, true, true, false),
    (new.id, 'festa', 'Quantidade de convidados', 'quantidade_convidados', 'number', true, true, 3, true, 'operacional', true, false, true, true, true),
    (new.id, 'pacote', 'Pacote escolhido', 'pacote_nome', 'text', true, true, 1, true, 'comercial', true, true, true, true, true),
    (new.id, 'pacote', 'Convidados inclusos no pacote', 'pacote_convidados_inclusos', 'number', true, true, 2, true, 'comercial', false, true, true, true, true),
    (new.id, 'pacote', 'Valor do pacote', 'valor_pacote', 'currency', true, true, 3, true, 'financeiro', true, true, false, false, true),
    (new.id, 'pacote', 'Itens inclusos', 'pacote_itens_inclusos', 'textarea', false, true, 4, true, 'comercial', false, true, true, true, false),
    (new.id, 'pacote', 'Itens não inclusos', 'pacote_itens_nao_inclusos', 'textarea', false, true, 5, true, 'comercial', false, true, true, true, false),
    (new.id, 'adicionais', 'Adicionais contratados', 'adicionais_selecionados', 'multiselect', false, true, 1, true, 'comercial', false, true, true, true, true),
    (new.id, 'adicionais', 'Valor dos adicionais', 'valor_adicionais', 'currency', false, true, 2, true, 'financeiro', false, true, false, false, true),
    (new.id, 'pagamento', 'Valor total', 'valor_total', 'currency', true, true, 1, true, 'financeiro', true, true, false, false, true),
    (new.id, 'pagamento', 'Valor da entrada', 'valor_entrada', 'currency', true, true, 2, true, 'financeiro', true, true, false, false, true),
    (new.id, 'pagamento', 'Forma de pagamento da entrada', 'forma_pagamento_entrada', 'select', true, true, 3, true, 'financeiro', false, true, false, false, true),
    (new.id, 'pagamento', 'Saldo restante', 'valor_saldo', 'currency', true, true, 4, true, 'financeiro', false, true, false, false, true),
    (new.id, 'pagamento', 'Forma de pagamento do saldo', 'forma_pagamento_saldo', 'select', true, true, 5, true, 'financeiro', false, true, false, false, true),
    (new.id, 'pagamento', 'Parcelamento', 'parcelas', 'number', false, true, 6, true, 'financeiro', false, false, false, false, true),
    (new.id, 'pagamento', 'Data limite de pagamento', 'data_limite_pagamento', 'date', false, true, 7, true, 'financeiro', false, true, false, false, true),
    (new.id, 'contrato', 'Observações do contrato', 'observacoes', 'textarea', false, true, 1, true, 'contratual', false, true, false, false, false)
  on conflict (tenant_id, field_key) do nothing;

  return new;
end;
$$;
