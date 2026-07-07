-- Instância Evolution de produção: festaai-vila-encantada-1783106792370-427490 (WhatsApp Luana).

insert into public.whatsapp_connections (tenant_id, name, instance_name, phone, status)
values (
  2,
  'WhatsApp Luana',
  'festaai-vila-encantada-1783106792370-427490',
  '48999672473',
  'connected'
)
on conflict (instance_name) do update
set
  name = excluded.name,
  phone = excluded.phone,
  status = excluded.status,
  last_error = null,
  updated_at = now();

-- Desativa registro legado (Vila - Luana) sem renomear para evitar conflito de unique.
update public.whatsapp_connections
set
  status = 'disconnected',
  last_error = 'Substituído por festaai-vila-encantada-1783106792370-427490',
  updated_at = now()
where tenant_id = 2
  and instance_name = 'Vila - Luana';

insert into public.whatsapp_connection_webhook_secrets (connection_id, instance_name, webhook_token)
select
  wc.id,
  'festaai-vila-encantada-1783106792370-427490',
  '072427bb87354c1ba16434c71fc3b225'
from public.whatsapp_connections wc
where wc.tenant_id = 2
  and wc.instance_name = 'festaai-vila-encantada-1783106792370-427490'
on conflict (connection_id) do update
set
  instance_name = excluded.instance_name,
  webhook_token = excluded.webhook_token,
  updated_at = now();

update public.tenant_automation_settings tas
set
  automation_template_bindings = coalesce(
    (
      select jsonb_agg(
        case
          when elem->>'key' = 'atendimento' then jsonb_build_object(
            'key',
            'atendimento',
            'connectionId',
            wc.id
          )
          else elem
        end
      )
      from jsonb_array_elements(coalesce(tas.automation_template_bindings, '[]'::jsonb)) as elem
    ),
    jsonb_build_array(
      jsonb_build_object('key', 'atendimento', 'connectionId', wc.id)
    )
  ),
  inbound_automation_enabled = true,
  n8n_inbound_webhook_url = 'https://webhooks.pratte.com.br/webhook/2808ab7b-d03d-43be-95d2-e2952f3a4ab3',
  n8n_provision_status = 'active',
  updated_at = now()
from public.whatsapp_connections wc
where tas.tenant_id = 2
  and wc.tenant_id = 2
  and wc.instance_name = 'festaai-vila-encantada-1783106792370-427490';
