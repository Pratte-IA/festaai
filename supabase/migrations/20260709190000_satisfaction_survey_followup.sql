-- Follow-up automático da pesquisa de satisfação (24h após envio sem resposta).

alter table public.eventos
  add column if not exists satisfaction_survey_followup_enviado_em timestamptz;

comment on column public.eventos.satisfaction_survey_followup_enviado_em is
  'Lembrete WhatsApp enviado 24h após a pesquisa, quando o cliente ainda não respondeu.';

create index if not exists eventos_satisfaction_survey_followup_pending_idx
  on public.eventos (tenant_id, satisfaction_survey_whatsapp_enviado_em)
  where satisfaction_survey_whatsapp_enviado_em is not null
    and satisfaction_survey_preenchido_em is null
    and satisfaction_survey_followup_enviado_em is null
    and funil = 'executadas'
    and etapa = 'aguardando_feedback';

create or replace function public.invoke_process_satisfaction_survey_followups()
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
    raise exception 'Missing vault secret service_role_key for satisfaction survey followups cron';
  end if;

  select decrypted_secret
  into cron_secret
  from vault.decrypted_secrets
  where name = 'satisfaction_survey_followups_cron_secret'
  limit 1;

  select net.http_post(
    url := project_url || '/functions/v1/process-satisfaction-survey-followups',
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

revoke all on function public.invoke_process_satisfaction_survey_followups() from public;
grant execute on function public.invoke_process_satisfaction_survey_followups() to postgres;

do $$
declare
  existing_job_id bigint;
begin
  select jobid
  into existing_job_id
  from cron.job
  where jobname = 'process-satisfaction-survey-followups-hourly';

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;
end $$;

select cron.schedule(
  'process-satisfaction-survey-followups-hourly',
  '35 * * * *',
  $$ select public.invoke_process_satisfaction_survey_followups(); $$
);

comment on function public.invoke_process_satisfaction_survey_followups() is
  'Dispara a Edge Function process-satisfaction-survey-followups (lembrete da pesquisa, a cada hora).';
