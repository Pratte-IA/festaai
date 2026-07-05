-- Follow-up automático de proposta (FU1): campos, trigger de etapa, cron horário.

alter table public.eventos
  add column if not exists proposta_enviada_em timestamptz,
  add column if not exists followup_status text,
  add column if not exists followup_cancelado_motivo text,
  add column if not exists followup_resposta_cliente_em timestamptz,
  add column if not exists followup_1_enviado_em timestamptz,
  add column if not exists followup_1_variante text;

comment on column public.eventos.proposta_enviada_em is
  'Marco inicial da sequência de follow-up (entrada em proposta_enviada).';

comment on column public.eventos.followup_status is
  'Estado da sequência: ativo, pausado_resposta, concluido_perdido, cancelado.';

comment on column public.eventos.followup_1_enviado_em is
  'Quando o follow-up 1 da proposta foi disparado pelo WhatsApp.';

comment on column public.eventos.followup_1_variante is
  'Variante do FU1: data_livre ou data_indisponivel.';

alter table public.eventos
  drop constraint if exists eventos_followup_status_check;

alter table public.eventos
  add constraint eventos_followup_status_check check (
    followup_status is null
    or followup_status in ('ativo', 'pausado_resposta', 'concluido_perdido', 'cancelado')
  );

alter table public.eventos
  drop constraint if exists eventos_followup_1_variante_check;

alter table public.eventos
  add constraint eventos_followup_1_variante_check check (
    followup_1_variante is null
    or followup_1_variante in ('data_livre', 'data_indisponivel')
  );

-- Dados legados: proposta enviada exige data da festa.
update public.eventos
set
  etapa = 'contato_inicial',
  followup_status = 'cancelado',
  followup_cancelado_motivo = 'sem_data_evento'
where funil = 'vendas'
  and etapa = 'proposta_enviada'
  and data_evento is null;

alter table public.eventos
  drop constraint if exists eventos_proposta_enviada_requires_data;

alter table public.eventos
  add constraint eventos_proposta_enviada_requires_data check (
    etapa <> 'proposta_enviada'
    or data_evento is not null
  );

create index if not exists eventos_proposta_followup_fu1_pending_idx
  on public.eventos (tenant_id, proposta_enviada_em)
  where funil = 'vendas'
    and etapa = 'proposta_enviada'
    and followup_status = 'ativo'
    and proposta_enviada_em is not null
    and followup_1_enviado_em is null;

-- Backfill: leads já em proposta_enviada entram na fila do FU1.
update public.eventos
set
  proposta_enviada_em = coalesce(proposta_enviada_em, updated_at),
  followup_status = coalesce(followup_status, 'ativo')
where funil = 'vendas'
  and etapa = 'proposta_enviada'
  and status_interno not in ('perdido', 'cancelado');

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
    and old.followup_status = 'ativo' then
    new.followup_status := 'cancelado';
    new.followup_cancelado_motivo := coalesce(new.followup_cancelado_motivo, 'mudou_etapa');
  end if;

  return new;
end;
$$;

drop trigger if exists eventos_sync_proposta_followup on public.eventos;

create trigger eventos_sync_proposta_followup
before insert or update of etapa, followup_status on public.eventos
for each row
execute function public.sync_proposta_followup_on_etapa_change();

create or replace function public.invoke_process_proposta_followups()
returns bigint
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  request_id bigint;
  cron_secret text;
  service_key text;
  project_url text := 'https://nuhnbqerbaqazkvmqufg.supabase.co';
begin
  select decrypted_secret
  into service_key
  from vault.decrypted_secrets
  where name = 'service_role_key'
  limit 1;

  if service_key is null then
    raise exception 'Missing vault secret service_role_key for proposta followups cron';
  end if;

  select decrypted_secret
  into cron_secret
  from vault.decrypted_secrets
  where name = 'proposta_followups_cron_secret'
  limit 1;

  select net.http_post(
    url := project_url || '/functions/v1/process-proposta-followups',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key,
      'apikey', service_key,
      'x-cron-secret', coalesce(cron_secret, '')
    ),
    body := '{}'::jsonb
  )
  into request_id;

  return request_id;
end;
$$;

revoke all on function public.invoke_process_proposta_followups() from public;
grant execute on function public.invoke_process_proposta_followups() to postgres;

do $$
declare
  existing_job_id bigint;
begin
  select jobid
  into existing_job_id
  from cron.job
  where jobname = 'process-proposta-followups-hourly';

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;
end $$;

select cron.schedule(
  'process-proposta-followups-hourly',
  '20 * * * *',
  $$ select public.invoke_process_proposta_followups(); $$
);

comment on function public.invoke_process_proposta_followups() is
  'Dispara a Edge Function process-proposta-followups (follow-up 1 de proposta, a cada hora).';
