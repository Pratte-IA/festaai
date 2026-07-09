-- Follow-up 0b (2ª tentativa de contato inicial): coluna + índice de fila.
-- 6h após o FU0, se o cliente não retornou → mensagem curta e lead para Perdido.

alter table public.eventos
  add column if not exists followup_0b_enviado_em timestamptz;

comment on column public.eventos.followup_0b_enviado_em is
  'Quando o follow-up 0b (2ª tentativa / encerramento de contato inicial) foi disparado. '
  'Após o envio, o lead é movido para perdido.';

create index if not exists eventos_proposta_followup_fu0b_pending_idx
  on public.eventos (tenant_id, followup_0_enviado_em)
  where funil = 'vendas'
    and etapa = 'contato_inicial'
    and followup_0_enviado_em is not null
    and followup_0b_enviado_em is null;

comment on function public.invoke_process_proposta_followups() is
  'Dispara a Edge Function process-proposta-followups (follow-ups 0, 0b e 1–4, a cada hora).';
