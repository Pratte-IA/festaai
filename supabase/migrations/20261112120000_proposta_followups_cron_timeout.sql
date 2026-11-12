-- O process-proposta-followups varre centenas de candidatos FU0 e leva ~20s+.
-- O default do pg_net (5s) abortava a request antes de disparar FU1–FU4.
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
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  )
  into request_id;

  return request_id;
end;
$$;

revoke all on function public.invoke_process_proposta_followups() from public;
grant execute on function public.invoke_process_proposta_followups() to postgres;

comment on function public.invoke_process_proposta_followups() is
  'Dispara a Edge Function process-proposta-followups (follow-ups 0, 0b e 1–4, a cada hora; timeout 120s).';
