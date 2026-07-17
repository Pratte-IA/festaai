-- Follow-up FOF (Oportunidade Futura): clientes que já festejaram conosco.
-- Sequência espelha o timing FOP (6 meses / +30d / 90 dias), no funil Executadas.

alter table public.eventos
  add column if not exists fof_status text,
  add column if not exists fof_festa_alvo date,
  add column if not exists fof1_enviado_em timestamptz,
  add column if not exists fof2_enviado_em timestamptz,
  add column if not exists fof3_enviado_em timestamptz,
  add column if not exists fof_resposta_cliente_em timestamptz;

comment on column public.eventos.fof_status is
  'Sequência FOF (oportunidade futura): ativo, pausado_resposta, cancelado.';

comment on column public.eventos.fof_festa_alvo is
  'Data alvo da próxima festa no ciclo FOF (aniversário seguinte à festa realizada).';

comment on column public.eventos.fof1_enviado_em is
  'Quando o follow-up FOF1 (6 meses antes do mês da festa) foi disparado.';

comment on column public.eventos.fof2_enviado_em is
  'Quando o follow-up FOF2 (30 dias após FOF1) foi disparado.';

comment on column public.eventos.fof3_enviado_em is
  'Quando o follow-up FOF3 (90 dias antes da festa alvo) foi disparado.';

comment on column public.eventos.fof_resposta_cliente_em is
  'Quando o cliente respondeu a um FOF — dispara criação/reuso de lead em Vendas.';

alter table public.eventos
  drop constraint if exists eventos_fof_status_check;

alter table public.eventos
  add constraint eventos_fof_status_check check (
    fof_status is null
    or fof_status in ('ativo', 'pausado_resposta', 'cancelado')
  );

create index if not exists eventos_oportunidade_futura_fof_pending_idx
  on public.eventos (tenant_id, fof_festa_alvo)
  where funil = 'executadas'
    and etapa = 'oportunidade_futura'
    and status_interno is distinct from 'cancelado'
    and data_evento is not null
    and (fof_status is null or fof_status = 'ativo');

create or replace function public.invoke_process_oportunidade_futura_followups()
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
    raise exception 'Missing vault secret service_role_key for oportunidade futura followups cron';
  end if;

  select decrypted_secret
  into cron_secret
  from vault.decrypted_secrets
  where name = 'oportunidade_futura_followups_cron_secret'
  limit 1;

  select net.http_post(
    url := project_url || '/functions/v1/process-oportunidade-futura-followups',
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

revoke all on function public.invoke_process_oportunidade_futura_followups() from public;
grant execute on function public.invoke_process_oportunidade_futura_followups() to postgres;

do $$
declare
  existing_job_id bigint;
begin
  select jobid
  into existing_job_id
  from cron.job
  where jobname = 'process-oportunidade-futura-followups-daily';

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;
end $$;

select cron.schedule(
  'process-oportunidade-futura-followups-daily',
  '45 9 * * *',
  $$ select public.invoke_process_oportunidade_futura_followups(); $$
);

comment on function public.invoke_process_oportunidade_futura_followups() is
  'Dispara a Edge Function process-oportunidade-futura-followups (FOF1/FOF2/FOF3, diariamente às 09:45 UTC).';
