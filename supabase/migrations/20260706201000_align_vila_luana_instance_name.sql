-- Alinha instance_name do segredo com o nome usado pela Evolution API ("Vila - Luana").

insert into public.whatsapp_connection_webhook_secrets (connection_id, instance_name, webhook_token)
select wc.id, 'Vila - Luana', 'f4e8a2c91b3d46578e0f1a2b3c4d5e6f'
from public.whatsapp_connections wc
where wc.tenant_id = 2
order by
  case
    when wc.instance_name = 'Vila - Luana' then 0
    when wc.name ilike '%luana%' then 1
    else 2
  end,
  wc.id
limit 1
on conflict (connection_id) do update
set
  instance_name = 'Vila - Luana',
  webhook_token = excluded.webhook_token,
  updated_at = now();

-- Garante que a conexão exista com o instance_name esperado pelo webhook da Evolution.
update public.whatsapp_connections wc
set
  instance_name = 'Vila - Luana',
  updated_at = now()
where wc.tenant_id = 2
  and (
    wc.name ilike '%luana%'
    or wc.phone like '%99672473%'
    or wc.instance_name = 'Vila - Luana'
  );
