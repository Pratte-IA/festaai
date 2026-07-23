-- FU3/FU4: reconsultar agenda e registrar variante data_livre / data_indisponivel.

alter table public.eventos
  add column if not exists followup_3_variante text,
  add column if not exists followup_4_variante text;

comment on column public.eventos.followup_3_variante is
  'Variante do FU3: data_livre (convite de visita) ou data_indisponivel.';

comment on column public.eventos.followup_4_variante is
  'Variante do FU4: data_livre ou data_indisponivel.';

alter table public.eventos
  drop constraint if exists eventos_followup_3_variante_check;

alter table public.eventos
  add constraint eventos_followup_3_variante_check check (
    followup_3_variante is null
    or followup_3_variante in ('data_livre', 'data_indisponivel')
  );

alter table public.eventos
  drop constraint if exists eventos_followup_4_variante_check;

alter table public.eventos
  add constraint eventos_followup_4_variante_check check (
    followup_4_variante is null
    or followup_4_variante in ('data_livre', 'data_indisponivel')
  );
