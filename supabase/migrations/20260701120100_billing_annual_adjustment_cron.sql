create or replace function public.invoke_process_annual_billing_adjustments()
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
    raise exception 'Missing vault secret service_role_key for annual billing adjustment cron';
  end if;

  select decrypted_secret
  into cron_secret
  from vault.decrypted_secrets
  where name = 'billing_annual_adjustment_cron_secret'
  limit 1;

  select net.http_post(
    url := project_url || '/functions/v1/process-annual-billing-adjustments',
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

revoke all on function public.invoke_process_annual_billing_adjustments() from public;
grant execute on function public.invoke_process_annual_billing_adjustments() to postgres;

do $$
declare
  existing_job_id bigint;
begin
  select jobid
  into existing_job_id
  from cron.job
  where jobname = 'process-annual-billing-adjustments-daily';

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;
end $$;

select cron.schedule(
  'process-annual-billing-adjustments-daily',
  '0 9 * * *',
  $$ select public.invoke_process_annual_billing_adjustments(); $$
);

comment on function public.invoke_process_annual_billing_adjustments() is
  'Dispara a Edge Function process-annual-billing-adjustments (reajuste anual IPCA via Asaas).';
