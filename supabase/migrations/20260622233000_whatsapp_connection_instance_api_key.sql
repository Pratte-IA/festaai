-- API key/token da instância Evolution (autenticação por instância no n8n/Evolution).
alter table public.whatsapp_connection_webhook_secrets
  add column if not exists instance_api_key text;

comment on column public.whatsapp_connection_webhook_secrets.instance_api_key is
  'Token/apikey da instância Evolution; usado para sincronizar credencial Evolution no n8n.';
