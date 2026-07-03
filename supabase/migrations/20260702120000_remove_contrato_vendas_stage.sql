-- Remove etapa Contrato do funil de vendas; leads vão direto para Festa / Boas Vindas.
update public.eventos
set
  funil = 'festa',
  etapa = 'boas_vindas',
  fechamento_confirmado_em = coalesce(fechamento_confirmado_em, now())
where funil = 'vendas'
  and etapa = 'contrato';

alter table public.eventos
  drop constraint if exists eventos_funil_etapa_check;

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
      and etapa in ('boas_vindas', 'planejamento', 'contrato', 'organizacao', 'festa_pronta')
    )
    or (
      funil = 'executadas'
      and etapa in ('aguardando_feedback', 'redes_sociais', 'oportunidade_futura')
    )
  );
