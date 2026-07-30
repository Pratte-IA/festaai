-- Indicador de conversa não lida no funil WhatsApp da plataforma.

alter table public.platform_whatsapp_conversations
  add column if not exists is_unread boolean not null default true;

create index if not exists platform_whatsapp_conversations_is_unread_idx
  on public.platform_whatsapp_conversations (is_unread)
  where is_unread = true;
