-- Padroniza categorias dos lançamentos financeiros para o plano unificado de descricao.

update public.financeiro_lancamentos
set categoria = 'entrada_contrato'
where categoria = 'contrato';

update public.financeiro_lancamentos
set categoria = 'pagamento_contrato'
where categoria in ('pagamento', 'upsell');

update public.financeiro_lancamentos
set categoria = 'buffet_salgados'
where categoria = 'buffet';

update public.financeiro_lancamentos
set categoria = 'gastos_fixos'
where categoria in ('aluguel', 'impostos', 'marketing', 'salarios', 'utilidades', 'assinaturas', 'outros');

update public.financeiro_lancamentos
set categoria = 'infraestrutura_investimentos'
where categoria = 'manutencao';

update public.financeiro_lancamentos
set categoria = 'equipe'
where categoria = 'terceiros';

update public.financeiro_lancamentos
set categoria = 'buffet_salgados'
where categoria = 'produtos';

create or replace function public.sync_financeiro_lancamento_from_pagamento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.financeiro_lancamentos (
      tenant_id,
      evento_id,
      tipo,
      categoria,
      origem,
      valor,
      data_lancamento,
      descricao,
      observacao,
      referencia_tipo,
      referencia_id,
      created_by,
      updated_by
    ) values (
      new.tenant_id,
      new.evento_id,
      'entrada',
      'pagamento_contrato',
      'pagamento',
      new.valor,
      new.data_pagamento,
      coalesce(nullif(trim(new.observacao), ''), 'Pagamento recebido'),
      new.observacao,
      'evento_pagamento',
      new.id,
      new.created_by,
      new.updated_by
    );
    return new;
  elsif tg_op = 'UPDATE' then
    update public.financeiro_lancamentos
    set
      evento_id = new.evento_id,
      valor = new.valor,
      data_lancamento = new.data_pagamento,
      categoria = 'pagamento_contrato',
      descricao = coalesce(nullif(trim(new.observacao), ''), 'Pagamento recebido'),
      observacao = new.observacao,
      updated_by = new.updated_by,
      updated_at = now()
    where referencia_tipo = 'evento_pagamento'
      and referencia_id = new.id
      and tenant_id = new.tenant_id;
    return new;
  elsif tg_op = 'DELETE' then
    delete from public.financeiro_lancamentos
    where referencia_tipo = 'evento_pagamento'
      and referencia_id = old.id
      and tenant_id = old.tenant_id;
    return old;
  end if;

  return null;
end;
$$;
