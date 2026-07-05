-- Automação outbound 7 dias Antes da Festa: webhook N8N, rastreio e cron diário.

alter table public.eventos
  add column if not exists sete_dias_whatsapp_enviado_em timestamptz;

comment on column public.eventos.sete_dias_whatsapp_enviado_em is
  'Quando o lembrete de 7 dias antes da festa foi disparado pelo WhatsApp via automação.';

create index if not exists eventos_sete_dias_whatsapp_pendente_idx
  on public.eventos (tenant_id, data_evento)
  where funil = 'festa'
    and status_interno = 'ativo'
    and data_evento is not null
    and sete_dias_whatsapp_enviado_em is null;

-- Vila Encantada (tenant 2): workflow de 7 dias publicado em produção (WhatsApp Luana).
insert into public.tenant_automation_settings (tenant_id, n8n_outbound_webhook_urls)
values (
  2,
  jsonb_build_object(
    'sete-dias-antes', 'https://webhooks.pratte.com.br/webhook/207e2de6-3f44-44ed-9cab-3a7a134fc8b7'
  )
)
on conflict (tenant_id) do update
set
  n8n_outbound_webhook_urls = coalesce(public.tenant_automation_settings.n8n_outbound_webhook_urls, '{}'::jsonb)
    || excluded.n8n_outbound_webhook_urls,
  updated_at = now();

create or replace function public.invoke_process_sete_dias_antes()
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
    raise exception 'Missing vault secret service_role_key for sete dias antes cron';
  end if;

  select decrypted_secret
  into cron_secret
  from vault.decrypted_secrets
  where name = 'sete_dias_antes_cron_secret'
  limit 1;

  select net.http_post(
    url := project_url || '/functions/v1/process-sete-dias-antes',
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

revoke all on function public.invoke_process_sete_dias_antes() from public;
grant execute on function public.invoke_process_sete_dias_antes() to postgres;

do $$
declare
  existing_job_id bigint;
begin
  select jobid
  into existing_job_id
  from cron.job
  where jobname = 'process-sete-dias-antes-daily';

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;
end $$;

select cron.schedule(
  'process-sete-dias-antes-daily',
  '0 11 * * *',
  $$ select public.invoke_process_sete_dias_antes(); $$
);

comment on function public.invoke_process_sete_dias_antes() is
  'Dispara a Edge Function process-sete-dias-antes (lembrete 7 dias antes da festa).';
