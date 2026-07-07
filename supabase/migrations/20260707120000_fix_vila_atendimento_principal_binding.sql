-- Corrige vínculos Vila Encantada: Atendimento → WhatsApp Principal; outbound → WhatsApp Luana.
-- A migration 20260706210000 havia invertido o atendimento para a instância da Luana.

insert into public.whatsapp_connections (tenant_id, name, instance_name, phone, status)
values
  (
    2,
    'WhatsApp Principal',
    'festaai-vila-encantada-1781746380080-711495',
    '4891664516',
    'connected'
  ),
  (
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

insert into public.whatsapp_connection_webhook_secrets (connection_id, instance_name, webhook_token)
select wc.id, wc.instance_name,
  case wc.instance_name
    when 'festaai-vila-encantada-1781746380080-711495' then 'f4e8a2c91b3d46578e0f1a2b3c4d5e6f'
    when 'festaai-vila-encantada-1783106792370-427490' then '072427bb87354c1ba16434c71fc3b225'
    else 'f4e8a2c91b3d46578e0f1a2b3c4d5e6f'
  end
from public.whatsapp_connections wc
where wc.tenant_id = 2
  and wc.instance_name in (
    'festaai-vila-encantada-1781746380080-711495',
    'festaai-vila-encantada-1783106792370-427490'
  )
on conflict (connection_id) do update
set
  instance_name = excluded.instance_name,
  webhook_token = excluded.webhook_token,
  updated_at = now();

with principal as (
  select id
  from public.whatsapp_connections
  where tenant_id = 2
    and instance_name = 'festaai-vila-encantada-1781746380080-711495'
  limit 1
),
luana as (
  select id
  from public.whatsapp_connections
  where tenant_id = 2
    and instance_name = 'festaai-vila-encantada-1783106792370-427490'
  limit 1
),
rebuilt_bindings as (
  select coalesce(
    (
      select jsonb_agg(
        case
          when elem->>'key' = 'atendimento' then jsonb_build_object(
            'key', 'atendimento',
            'connectionId', principal.id
          )
          when elem->>'key' = 'boas-vindas' then jsonb_build_object(
            'key', 'boas-vindas',
            'connectionId', luana.id
          )
          when elem->>'key' = 'sete-dias-antes' then jsonb_build_object(
            'key', 'sete-dias-antes',
            'connectionId', luana.id
          )
          else elem
        end
      )
      from public.tenant_automation_settings tas
      cross join principal
      cross join luana,
      jsonb_array_elements(coalesce(tas.automation_template_bindings, '[]'::jsonb)) as elem
      where tas.tenant_id = 2
    ),
    (
      select jsonb_build_array(
        jsonb_build_object('key', 'atendimento', 'connectionId', principal.id),
        jsonb_build_object('key', 'boas-vindas', 'connectionId', luana.id),
        jsonb_build_object('key', 'sete-dias-antes', 'connectionId', luana.id)
      )
      from principal
      cross join luana
    )
  ) as bindings
)
update public.tenant_automation_settings tas
set
  automation_template_bindings = rebuilt_bindings.bindings,
  inbound_automation_enabled = true,
  n8n_inbound_webhook_url = 'https://webhooks.pratte.com.br/webhook/2808ab7b-d03d-43be-95d2-e2952f3a4ab3',
  n8n_provision_status = 'active',
  updated_at = now()
from rebuilt_bindings
where tas.tenant_id = 2;
