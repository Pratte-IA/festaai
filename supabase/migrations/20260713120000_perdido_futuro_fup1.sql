-- Follow-up de oportunidade para leads perdidos com festa futura (FUP1 — 60 dias antes).

alter table public.eventos
  add column if not exists fup1_enviado_em timestamptz,
  add column if not exists fup1_variante text,
  add column if not exists fup_resposta_cliente_em timestamptz;

comment on column public.eventos.fup1_enviado_em is
  'Quando o follow-up FUP1 (festa futura, 60 dias antes) foi disparado.';

comment on column public.eventos.fup1_variante is
  'Variante do FUP1: data_livre ou data_indisponivel.';

alter table public.eventos
  drop constraint if exists eventos_fup1_variante_check;

alter table public.eventos
  add constraint eventos_fup1_variante_check check (
    fup1_variante is null
    or fup1_variante in ('data_livre', 'data_indisponivel')
  );

create index if not exists eventos_perdido_futuro_fup1_pending_idx
  on public.eventos (tenant_id, data_evento)
  where funil = 'vendas'
    and etapa = 'perdido'
    and status_interno = 'perdido'
    and data_evento is not null
    and fup1_enviado_em is null;
