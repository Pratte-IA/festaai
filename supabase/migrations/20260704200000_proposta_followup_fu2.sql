-- Follow-up automático de proposta (FU2): campos e índice de fila.

alter table public.eventos
  add column if not exists followup_2_enviado_em timestamptz,
  add column if not exists followup_2_variante text;

comment on column public.eventos.followup_2_enviado_em is
  'Quando o follow-up 2 da proposta foi disparado pelo WhatsApp.';

comment on column public.eventos.followup_2_variante is
  'Variante do FU2: data_livre ou data_indisponivel.';

alter table public.eventos
  drop constraint if exists eventos_followup_2_variante_check;

alter table public.eventos
  add constraint eventos_followup_2_variante_check check (
    followup_2_variante is null
    or followup_2_variante in ('data_livre', 'data_indisponivel')
  );

create index if not exists eventos_proposta_followup_fu2_pending_idx
  on public.eventos (tenant_id, followup_1_enviado_em)
  where funil = 'vendas'
    and etapa = 'proposta_enviada'
    and followup_status = 'ativo'
    and followup_1_enviado_em is not null
    and followup_2_enviado_em is null;

comment on function public.invoke_process_proposta_followups() is
  'Dispara a Edge Function process-proposta-followups (follow-ups 1 e 2 de proposta, a cada hora).';
