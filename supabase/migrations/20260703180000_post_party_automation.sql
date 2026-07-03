-- Transição automática Festa → Executadas / Aguardando Feedback e rastreio da pesquisa.

alter table public.eventos
  add column if not exists executadas_transicao_em timestamptz,
  add column if not exists satisfaction_survey_preenchido_em timestamptz,
  add column if not exists satisfaction_survey_whatsapp_enviado_em timestamptz;

comment on column public.eventos.executadas_transicao_em is
  'Quando o lead foi movido automaticamente de Festa para Executadas / aguardando_feedback.';

comment on column public.eventos.satisfaction_survey_preenchido_em is
  'Quando o cliente concluiu a pesquisa de satisfação pós-festa.';

comment on column public.eventos.satisfaction_survey_whatsapp_enviado_em is
  'Quando o link da pesquisa de satisfação foi disparado pelo WhatsApp via automação.';

alter table public.automation_dispatch_logs
  drop constraint if exists automation_dispatch_logs_direction_check;

alter table public.automation_dispatch_logs
  add constraint automation_dispatch_logs_direction_check check (
    direction in (
      'inbound_to_n8n',
      'outbound_from_n8n',
      'outbound_to_n8n',
      'outbound_whatsapp'
    )
  );

create index if not exists eventos_post_party_transition_pending_idx
  on public.eventos (tenant_id, data_evento)
  where funil = 'festa'
    and status_interno = 'ativo'
    and data_evento is not null
    and executadas_transicao_em is null;

create or replace function public.invoke_process_post_party_transitions()
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
    raise exception 'Missing vault secret service_role_key for post-party transitions cron';
  end if;

  select decrypted_secret
  into cron_secret
  from vault.decrypted_secrets
  where name = 'post_party_transitions_cron_secret'
  limit 1;

  select net.http_post(
    url := project_url || '/functions/v1/process-post-party-transitions',
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

revoke all on function public.invoke_process_post_party_transitions() from public;
grant execute on function public.invoke_process_post_party_transitions() to postgres;

do $$
declare
  existing_job_id bigint;
begin
  select jobid
  into existing_job_id
  from cron.job
  where jobname = 'process-post-party-transitions-daily';

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;
end $$;

select cron.schedule(
  'process-post-party-transitions-daily',
  '0 11 * * *',
  $$ select public.invoke_process_post_party_transitions(); $$
);

comment on function public.invoke_process_post_party_transitions() is
  'Dispara a Edge Function process-post-party-transitions (Festa → Executadas / aguardando_feedback).';
