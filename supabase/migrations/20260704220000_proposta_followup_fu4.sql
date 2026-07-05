-- Follow-up automático de proposta (FU4 — encerramento): campo, índice e trigger.

alter table public.eventos
  add column if not exists followup_4_enviado_em timestamptz;

comment on column public.eventos.followup_4_enviado_em is
  'Quando o follow-up 4 (encerramento) da proposta foi disparado pelo WhatsApp.';

create index if not exists eventos_proposta_followup_fu4_pending_idx
  on public.eventos (tenant_id, followup_3_enviado_em)
  where funil = 'vendas'
    and etapa = 'proposta_enviada'
    and followup_status = 'ativo'
    and followup_3_enviado_em is not null
    and followup_4_enviado_em is null;

-- Não sobrescrever concluido_perdido quando o FU4 move o lead para perdido.
create or replace function public.sync_proposta_followup_on_etapa_change()
returns trigger
language plpgsql
as $$
begin
  if new.etapa = 'proposta_enviada'
    and (tg_op = 'INSERT' or old.etapa is distinct from 'proposta_enviada') then
    new.proposta_enviada_em := coalesce(new.proposta_enviada_em, now());
    new.followup_status := 'ativo';
    new.followup_cancelado_motivo := null;
  elsif old.etapa = 'proposta_enviada'
    and new.etapa is distinct from 'proposta_enviada'
    and old.followup_status = 'ativo'
    and new.followup_status is distinct from 'concluido_perdido' then
    new.followup_status := 'cancelado';
    new.followup_cancelado_motivo := coalesce(new.followup_cancelado_motivo, 'mudou_etapa');
  end if;

  return new;
end;
$$;

comment on function public.invoke_process_proposta_followups() is
  'Dispara a Edge Function process-proposta-followups (follow-ups 1 a 4 de proposta, a cada hora).';
