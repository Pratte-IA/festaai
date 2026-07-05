-- Follow-up automático de proposta (FU3 — convite de visita): campo e índice de fila.

alter table public.eventos
  add column if not exists followup_3_enviado_em timestamptz;

comment on column public.eventos.followup_3_enviado_em is
  'Quando o follow-up 3 (convite de visita) da proposta foi disparado pelo WhatsApp.';

create index if not exists eventos_proposta_followup_fu3_pending_idx
  on public.eventos (tenant_id, followup_2_enviado_em)
  where funil = 'vendas'
    and etapa = 'proposta_enviada'
    and followup_status = 'ativo'
    and followup_2_enviado_em is not null
    and followup_3_enviado_em is null;

comment on function public.invoke_process_proposta_followups() is
  'Dispara a Edge Function process-proposta-followups (follow-ups 1, 2 e 3 de proposta, a cada hora).';
