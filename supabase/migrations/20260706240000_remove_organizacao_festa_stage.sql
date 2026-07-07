-- Remove etapa Organizacao do funil Festa.
update public.eventos
set etapa = 'planejamento'
where funil = 'festa'
  and etapa = 'organizacao';

alter table public.eventos
  drop constraint if exists eventos_funil_etapa_check,
  drop constraint if exists eventos_etapa_check;

alter table public.eventos
  add constraint eventos_etapa_check check (
    etapa in (
      'contato_inicial',
      'proposta_enviada',
      'negociacao',
      'visita_agendada',
      'perdido',
      'boas_vindas',
      'planejamento',
      'festa_pronta',
      'aguardando_feedback',
      'redes_sociais',
      'oportunidade_futura'
    )
  );

alter table public.eventos
  add constraint eventos_funil_etapa_check check (
    (
      funil = 'vendas'
      and etapa in (
        'contato_inicial',
        'proposta_enviada',
        'negociacao',
        'visita_agendada',
        'perdido'
      )
    )
    or (
      funil = 'festa'
      and etapa in ('boas_vindas', 'planejamento', 'festa_pronta')
    )
    or (
      funil = 'executadas'
      and etapa in ('aguardando_feedback', 'redes_sociais', 'oportunidade_futura')
    )
  );
