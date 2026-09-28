-- O trigger que cria os campos padrão do formulário público sumiu do banco.
-- Sem esses campos o cliente só vê pacote/adicionais/aceites e o envio falha
-- com "Dados inválidos" porque a API exige ao menos um campo.

drop trigger if exists seed_closing_form_on_tenant_create on public.tenants;

create trigger seed_closing_form_on_tenant_create
after insert on public.tenants
for each row
execute function public.seed_tenant_closing_form_fields();

insert into public.tenant_closing_form_fields (
  tenant_id,
  section,
  label,
  field_key,
  field_type,
  required,
  active,
  sort_order,
  is_system,
  category,
  is_locked,
  usage_contract,
  usage_party_summary,
  usage_ai,
  usage_reports
)
select
  tenants.id,
  seed.section,
  seed.label,
  seed.field_key,
  seed.field_type,
  seed.required,
  true,
  seed.sort_order,
  true,
  seed.category,
  seed.is_locked,
  seed.usage_contract,
  seed.usage_party_summary,
  seed.usage_ai,
  seed.usage_reports
from public.tenants
cross join (
  values
    ('cliente', 'Nome completo', 'cliente_nome', 'text', true, 1, 'contratual', true, true, true, true, true),
    ('cliente', 'Telefone', 'cliente_telefone', 'phone', true, 2, 'contratual', true, true, true, true, false),
    ('cliente', 'E-mail', 'cliente_email', 'email', false, 3, 'contratual', false, true, false, true, false),
    ('cliente', 'CPF', 'cliente_cpf', 'text', true, 4, 'contratual', true, true, true, true, true),
    ('cliente', 'CEP', 'cliente_cep', 'text', true, 5, 'contratual', false, true, true, false, false),
    ('cliente', 'Rua', 'cliente_rua', 'text', true, 6, 'contratual', false, true, true, false, false),
    ('cliente', 'Número', 'cliente_numero', 'text', true, 7, 'contratual', false, true, true, false, false),
    ('cliente', 'Bairro', 'cliente_bairro', 'text', true, 8, 'contratual', false, true, true, false, false),
    ('cliente', 'Cidade', 'cliente_cidade', 'text', true, 9, 'contratual', false, true, true, false, false),
    ('cliente', 'Estado', 'cliente_estado', 'text', true, 10, 'contratual', false, true, true, false, false),
    ('aniversariante', 'Nome do aniversariante', 'aniversariante_nome', 'text', true, 1, 'operacional', true, false, true, true, true),
    ('aniversariante', 'Data de nascimento', 'aniversariante_data_nascimento', 'date', true, 2, 'operacional', true, false, true, true, false),
    ('festa', 'Data da festa', 'data_evento', 'date', true, 1, 'operacional', true, true, true, true, true),
    ('festa', 'Horário de início', 'hora_evento', 'time', true, 2, 'operacional', true, true, true, true, false),
    ('festa', 'Quantidade de convidados', 'quantidade_convidados', 'number', true, 3, 'operacional', true, false, true, true, true),
    ('pacote', 'Pacote contratado', 'pacote_nome', 'select', true, 1, 'comercial', true, true, true, true, true),
    ('adicionais', 'Adicionais contratados', 'adicionais_selecionados', 'multiselect', false, 1, 'comercial', false, true, true, true, true),
    ('adicionais', 'Valor dos adicionais', 'valor_adicionais', 'currency', false, 2, 'financeiro', false, true, false, false, true),
    ('pagamento', 'Valor total', 'valor_total', 'currency', true, 1, 'financeiro', true, true, false, false, true),
    ('pagamento', 'Valor da entrada', 'valor_entrada', 'currency', true, 2, 'financeiro', true, true, false, false, true),
    ('pagamento', 'Forma de pagamento da entrada', 'forma_pagamento_entrada', 'select', true, 3, 'financeiro', false, true, false, false, true),
    ('pagamento', 'Saldo restante', 'valor_saldo', 'currency', true, 4, 'financeiro', false, true, false, false, true),
    ('pagamento', 'Forma de pagamento do saldo', 'forma_pagamento_saldo', 'select', true, 5, 'financeiro', false, true, false, false, true),
    ('pagamento', 'Parcelamento', 'parcelas', 'number', false, 6, 'financeiro', false, false, false, false, true),
    ('pagamento', 'Data limite de pagamento', 'data_limite_pagamento', 'date', false, 7, 'financeiro', false, true, false, false, true),
    ('contrato', 'Observações do contrato', 'observacoes', 'textarea', false, 1, 'contratual', false, true, false, false, false)
) as seed (
  section,
  label,
  field_key,
  field_type,
  required,
  sort_order,
  category,
  is_locked,
  usage_contract,
  usage_party_summary,
  usage_ai,
  usage_reports
)
on conflict (tenant_id, field_key) do nothing;
