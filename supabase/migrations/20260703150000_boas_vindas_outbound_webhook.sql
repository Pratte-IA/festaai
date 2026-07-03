-- Automação outbound Boas Vindas: webhook N8N por template + rastreio de envio.

alter table public.tenant_automation_settings
  add column if not exists n8n_outbound_webhook_urls jsonb not null default '{}'::jsonb;

comment on column public.tenant_automation_settings.n8n_outbound_webhook_urls is
  'URLs de webhook de produção por chave comercial: { "boas-vindas": "https://..." }.';

alter table public.eventos
  add column if not exists boas_vindas_whatsapp_enviado_em timestamptz;

drop index if exists public.eventos_boas_vindas_whatsapp_pendente_idx;

create index if not exists eventos_boas_vindas_whatsapp_pendente_idx
  on public.eventos (tenant_id, boas_vindas_whatsapp_agendado_em)
  where boas_vindas_whatsapp_agendado_em is not null
    and boas_vindas_whatsapp_enviado_em is null;

alter table public.automation_dispatch_logs
  drop constraint if exists automation_dispatch_logs_direction_check;

alter table public.automation_dispatch_logs
  add constraint automation_dispatch_logs_direction_check check (
    direction in ('inbound_to_n8n', 'outbound_from_n8n', 'outbound_to_n8n')
  );

-- Vila Encantada (tenant 2): workflow de boas-vindas publicado em produção.
insert into public.tenant_automation_settings (tenant_id, n8n_outbound_webhook_urls)
values (
  2,
  jsonb_build_object(
    'boas-vindas', 'https://webhooks.pratte.com.br/webhook/5d8b9ba2-773d-4f07-89c7-6a2db271ea41'
  )
)
on conflict (tenant_id) do update
set
  n8n_outbound_webhook_urls = coalesce(public.tenant_automation_settings.n8n_outbound_webhook_urls, '{}'::jsonb)
    || excluded.n8n_outbound_webhook_urls,
  updated_at = now();
