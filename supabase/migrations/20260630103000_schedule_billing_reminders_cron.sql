create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

create or replace function public.invoke_process_billing_reminders()
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
    raise exception 'Missing vault secret service_role_key for billing reminders cron';
  end if;

  select decrypted_secret
  into cron_secret
  from vault.decrypted_secrets
  where name = 'billing_reminders_cron_secret'
  limit 1;

  select net.http_post(
    url := project_url || '/functions/v1/process-billing-reminders',
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

revoke all on function public.invoke_process_billing_reminders() from public;
grant execute on function public.invoke_process_billing_reminders() to postgres;

do $$
declare
  existing_job_id bigint;
begin
  select jobid
  into existing_job_id
  from cron.job
  where jobname = 'process-billing-reminders-daily';

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;
end $$;

select cron.schedule(
  'process-billing-reminders-daily',
  '0 10 * * *',
  $$ select public.invoke_process_billing_reminders(); $$
);

comment on function public.invoke_process_billing_reminders() is
  'Dispara a Edge Function process-billing-reminders (lembretes de boleto, atraso e bloqueio).';
