-- Vínculos comerciais template → conexão WhatsApp (independente do mapa técnico n8n_workflows).

alter table public.tenant_automation_settings
  add column if not exists automation_template_bindings jsonb not null default '[]'::jsonb;

comment on column public.tenant_automation_settings.automation_template_bindings is
  'Vínculos por chave comercial do template: [{ "key": "atendimento", "connectionId": 12 }].';
