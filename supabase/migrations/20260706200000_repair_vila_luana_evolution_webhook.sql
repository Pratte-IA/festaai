-- Reparo: webhook Evolution da instância "Vila - Luana" estava ausente (null) em 2026-07-06.
-- Sincroniza token usado no header x-webhook-token enviado à edge function evolution-connection-webhook.

insert into public.whatsapp_connection_webhook_secrets (connection_id, instance_name, webhook_token)
select wc.id, wc.instance_name, 'f4e8a2c91b3d46578e0f1a2b3c4d5e6f'
from public.whatsapp_connections wc
where wc.instance_name = 'Vila - Luana'
on conflict (connection_id) do update
set
  instance_name = excluded.instance_name,
  webhook_token = excluded.webhook_token,
  updated_at = now();
