alter table public.eventos
  add column if not exists convidados_alteracoes_historico jsonb not null default '[]'::jsonb;

comment on column public.eventos.convidados_alteracoes_historico is
  'Histórico interno de alterações de convidados após contrato assinado (não altera o contrato).';
