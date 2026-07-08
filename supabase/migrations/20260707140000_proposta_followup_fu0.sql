-- Follow-up automático de contato inicial (FU0): campos e índice de fila.
-- Nudge para leads que estão em Contato Inicial e não retornaram após a nossa
-- última mensagem (12h depois, dentro do horário comercial 08h–18h).

alter table public.eventos
  add column if not exists contato_inicial_ultima_mensagem_em timestamptz,
  add column if not exists followup_0_enviado_em timestamptz;

comment on column public.eventos.contato_inicial_ultima_mensagem_em is
  'Marco do FU0: horário da nossa última mensagem enviada ao lead em contato_inicial. '
  'Zerado quando o cliente responde (o timer de 12h só corre enquanto aguardamos o retorno).';

comment on column public.eventos.followup_0_enviado_em is
  'Quando o follow-up 0 (retomada de contato inicial) foi disparado pelo WhatsApp.';

-- Fila do FU0: leads em contato inicial com nossa última mensagem registrada e
-- ainda sem FU0 enviado.
create index if not exists eventos_proposta_followup_fu0_pending_idx
  on public.eventos (tenant_id, contato_inicial_ultima_mensagem_em)
  where funil = 'vendas'
    and etapa = 'contato_inicial'
    and contato_inicial_ultima_mensagem_em is not null
    and followup_0_enviado_em is null;

comment on function public.invoke_process_proposta_followups() is
  'Dispara a Edge Function process-proposta-followups (follow-ups 0 a 4 de proposta, a cada hora).';
