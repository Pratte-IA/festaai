-- Roteamento N8N por tenant: workflow dedicado, provisionamento em rascunho, ativação manual.

alter table public.tenant_automation_settings
  add column if not exists n8n_inbound_webhook_url text,
  add column if not exists n8n_workflow_id text,
  add column if not exists n8n_editor_url text,
  add column if not exists n8n_provision_status text not null default 'draft',
  add column if not exists n8n_provisioned_at timestamptz,
  add column if not exists n8n_last_error text;

alter table public.tenant_automation_settings
  drop constraint if exists tenant_automation_settings_n8n_provision_status_check;

alter table public.tenant_automation_settings
  add constraint tenant_automation_settings_n8n_provision_status_check check (
    n8n_provision_status in ('draft', 'active', 'error')
  );

comment on column public.tenant_automation_settings.n8n_provision_status is
  'draft = workflow clonado, aguardando personalização/publicação no N8N; active = publicado e liberado manualmente no FestaAi.';

comment on column public.tenant_automation_settings.inbound_automation_enabled is
  'Deve ser true apenas após publicar o workflow no N8N e concluir parametrização (ativação manual).';

-- Vila Encantada (tenant 2): workflow já publicado e testado em produção.
insert into public.tenant_automation_settings (
  tenant_id,
  inbound_automation_enabled,
  n8n_routing_key,
  n8n_inbound_webhook_url,
  n8n_provision_status,
  n8n_provisioned_at
)
values (
  2,
  true,
  'vila-encantada',
  'https://webhooks.pratte.com.br/webhook/2808ab7b-d03d-43be-95d2-e2952f3a4ab3',
  'active',
  now()
)
on conflict (tenant_id) do update
set
  n8n_inbound_webhook_url = excluded.n8n_inbound_webhook_url,
  n8n_provision_status = excluded.n8n_provision_status,
  n8n_provisioned_at = coalesce(public.tenant_automation_settings.n8n_provisioned_at, excluded.n8n_provisioned_at),
  updated_at = now();
