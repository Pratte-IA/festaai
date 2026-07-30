-- Foto de perfil do contato WhatsApp (URL da Evolution / WhatsApp CDN).

alter table public.platform_whatsapp_conversations
  add column if not exists avatar_url text;

alter table public.platform_whatsapp_conversations
  add column if not exists avatar_fetched_at timestamptz;
