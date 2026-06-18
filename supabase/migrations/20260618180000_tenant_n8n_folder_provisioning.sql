-- Provisionamento N8N por pasta: clone da pasta Templates → pasta do tenant.

alter table public.tenant_automation_settings
  add column if not exists n8n_folder_id text,
  add column if not exists n8n_workflows jsonb;

comment on column public.tenant_automation_settings.n8n_folder_id is
  'Pasta N8N dedicada ao tenant (ex: ALEGRIA - FESTAAI).';

comment on column public.tenant_automation_settings.n8n_workflows is
  'Mapa dos workflows clonados: [{ templateId, workflowId, name }].';
