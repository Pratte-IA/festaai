-- Competência mensal para despesas (e demais lançamentos) sem alterar o ledger de caixa.
-- data_competencia guarda o 1º dia do mês de referência (ex.: 2026-03-01 = março/2026).

alter table public.financeiro_lancamentos
  add column if not exists data_competencia date;

comment on column public.financeiro_lancamentos.data_competencia is
  'Primeiro dia do mês de competência. Despesas vinculadas a festa usam o mês de data_evento; despesas operacionais usam competência própria.';

-- Despesas/lançamentos vinculados a festa: mês da data da festa (não sobrescreve se já preenchido).
update public.financeiro_lancamentos fl
set data_competencia = date_trunc('month', e.data_evento)::date
from public.eventos e
where fl.evento_id = e.id
  and fl.tenant_id = e.tenant_id
  and fl.data_competencia is null
  and e.data_evento is not null;

-- Sem vínculo com festa: data de lançamento (pagamento), senão created_at.
update public.financeiro_lancamentos
set data_competencia = date_trunc('month', coalesce(data_lancamento, created_at::date))::date
where data_competencia is null
  and evento_id is null;

-- Restante (ex.: festa sem data_evento): fallback seguro.
update public.financeiro_lancamentos
set data_competencia = date_trunc('month', coalesce(data_lancamento, created_at::date))::date
where data_competencia is null;

create index if not exists financeiro_lancamentos_tenant_competencia_idx
  on public.financeiro_lancamentos (tenant_id, data_competencia)
  where evento_id is null;

-- Sync de pagamentos: preenche competência a partir da data da festa (caixa continua em data_lancamento).
create or replace function public.sync_financeiro_lancamento_from_pagamento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  competencia_festa date;
begin
  if tg_op = 'INSERT' or tg_op = 'UPDATE' then
    select date_trunc('month', e.data_evento)::date
      into competencia_festa
    from public.eventos e
    where e.id = new.evento_id
      and e.tenant_id = new.tenant_id;
  end if;

  if tg_op = 'INSERT' then
    insert into public.financeiro_lancamentos (
      tenant_id,
      evento_id,
      tipo,
      categoria,
      origem,
      valor,
      data_lancamento,
      data_competencia,
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
      coalesce(competencia_festa, date_trunc('month', new.data_pagamento)::date),
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
      data_competencia = coalesce(competencia_festa, date_trunc('month', new.data_pagamento)::date),
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
