-- Backfill: conversas que só tinham preview ganham uma mensagem inicial no histórico.
insert into public.platform_whatsapp_messages (
  conversation_id,
  connection_id,
  direction,
  body,
  message_type,
  from_me,
  sent_at
)
select
  c.id,
  c.connection_id,
  'inbound',
  coalesce(nullif(trim(c.last_message_preview), ''), '[Mensagem]'),
  'text',
  false,
  coalesce(c.last_message_at, c.created_at)
from public.platform_whatsapp_conversations c
where not exists (
  select 1
  from public.platform_whatsapp_messages m
  where m.conversation_id = c.id
)
and c.last_message_preview is not null;
