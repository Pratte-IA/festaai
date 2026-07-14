-- Follow-up de reativação de leads perdidos (FOP1/FOP2/FOP3): festa já realizada, tentativa no ano seguinte.

alter table public.eventos
  add column if not exists reativacao_status text,
  add column if not exists reativacao_festa_alvo date,
  add column if not exists fop1_enviado_em timestamptz,
  add column if not exists fop2_enviado_em timestamptz,
  add column if not exists fop3_enviado_em timestamptz,
  add column if not exists fop_resposta_cliente_em timestamptz;

comment on column public.eventos.reativacao_status is
  'Sequência FOP de reativação: ativo, pausado_resposta, cancelado.';

comment on column public.eventos.reativacao_festa_alvo is
  'Data alvo da festa no ciclo atual de reativação (ano seguinte à festa perdida).';

comment on column public.eventos.fop1_enviado_em is
  'Quando o follow-up de reativação FOP1 foi disparado.';

comment on column public.eventos.fop2_enviado_em is
  'Quando o follow-up de reativação FOP2 foi disparado.';

comment on column public.eventos.fop3_enviado_em is
  'Quando o follow-up de reativação FOP3 foi disparado.';

alter table public.eventos
  drop constraint if exists eventos_reativacao_status_check;

alter table public.eventos
  add constraint eventos_reativacao_status_check check (
    reativacao_status is null
    or reativacao_status in ('ativo', 'pausado_resposta', 'cancelado')
  );

create index if not exists eventos_perdido_reativacao_fop_pending_idx
  on public.eventos (tenant_id, reativacao_festa_alvo)
  where funil = 'vendas'
    and etapa = 'perdido'
    and status_interno = 'perdido'
    and data_evento is not null
    and (reativacao_status is null or reativacao_status = 'ativo');

create or replace function public.invoke_process_perdido_reativacao_followups()
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
    raise exception 'Missing vault secret service_role_key for perdido reativacao followups cron';
  end if;

  select decrypted_secret
  into cron_secret
  from vault.decrypted_secrets
  where name = 'perdido_reativacao_followups_cron_secret'
  limit 1;

  select net.http_post(
    url := project_url || '/functions/v1/process-perdido-reativacao-followups',
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

revoke all on function public.invoke_process_perdido_reativacao_followups() from public;
grant execute on function public.invoke_process_perdido_reativacao_followups() to postgres;

do $$
declare
  existing_job_id bigint;
begin
  select jobid
  into existing_job_id
  from cron.job
  where jobname = 'process-perdido-reativacao-followups-daily';

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;
end $$;

select cron.schedule(
  'process-perdido-reativacao-followups-daily',
  '30 9 * * *',
  $$ select public.invoke_process_perdido_reativacao_followups(); $$
);

comment on function public.invoke_process_perdido_reativacao_followups() is
  'Dispara a Edge Function process-perdido-reativacao-followups (FOP1/FOP2/FOP3 de reativação, diariamente às 09:30 UTC).';
