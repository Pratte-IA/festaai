-- Follow-up automático de assinatura de contrato (formulário público preenchido sem assinar).

alter table public.evento_contracts
  add column if not exists assinatura_followup_status text,
  add column if not exists assinatura_followup_inicial_enviado_em timestamptz,
  add column if not exists assinatura_followup_ultimo_enviado_em timestamptz,
  add column if not exists assinatura_followup_lembrete_count integer not null default 0;

comment on column public.evento_contracts.assinatura_followup_status is
  'Estado da sequência de follow-up de assinatura: ativo ou cancelado.';

comment on column public.evento_contracts.assinatura_followup_inicial_enviado_em is
  'Primeiro follow-up estruturado (3h após geração do contrato).';

comment on column public.evento_contracts.assinatura_followup_ultimo_enviado_em is
  'Último follow-up enviado (inicial ou lembrete a cada 6h).';

comment on column public.evento_contracts.assinatura_followup_lembrete_count is
  'Quantidade de lembretes simples enviados após o follow-up inicial.';

alter table public.evento_contracts
  drop constraint if exists evento_contracts_assinatura_followup_status_check;

alter table public.evento_contracts
  add constraint evento_contracts_assinatura_followup_status_check check (
    assinatura_followup_status is null
    or assinatura_followup_status in ('ativo', 'cancelado')
  );

update public.evento_contracts
set assinatura_followup_status = 'ativo'
where status = 'generated'
  and assinatura_followup_status is null;

update public.evento_contracts
set assinatura_followup_status = 'cancelado'
where status in ('accepted', 'cancelled', 'superseded')
  and assinatura_followup_status is null;

create index if not exists evento_contracts_assinatura_followup_inicial_pending_idx
  on public.evento_contracts (tenant_id, generated_at)
  where status = 'generated'
    and assinatura_followup_status = 'ativo'
    and assinatura_followup_inicial_enviado_em is null;

create index if not exists evento_contracts_assinatura_followup_lembrete_pending_idx
  on public.evento_contracts (tenant_id, assinatura_followup_ultimo_enviado_em)
  where status = 'generated'
    and assinatura_followup_status = 'ativo'
    and assinatura_followup_inicial_enviado_em is not null;

create or replace function public.invoke_process_contract_signature_followups()
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
    raise exception 'Missing vault secret service_role_key for contract signature followups cron';
  end if;

  select decrypted_secret
  into cron_secret
  from vault.decrypted_secrets
  where name = 'contract_signature_followups_cron_secret'
  limit 1;

  select net.http_post(
    url := project_url || '/functions/v1/process-contract-signature-followups',
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

revoke all on function public.invoke_process_contract_signature_followups() from public;
grant execute on function public.invoke_process_contract_signature_followups() to postgres;

do $$
declare
  existing_job_id bigint;
begin
  select jobid
  into existing_job_id
  from cron.job
  where jobname = 'process-contract-signature-followups-hourly';

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;
end $$;

select cron.schedule(
  'process-contract-signature-followups-hourly',
  '25 * * * *',
  $$ select public.invoke_process_contract_signature_followups(); $$
);

comment on function public.invoke_process_contract_signature_followups() is
  'Dispara a Edge Function process-contract-signature-followups (lembretes de assinatura, a cada hora).';
