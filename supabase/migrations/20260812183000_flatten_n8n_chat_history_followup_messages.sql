-- Follow-ups gravados pelo FestaAI usavam { type, data: { content } }.
-- O Postgres Chat Memory do n8n espera { type, content, ... } (formato achatado).
-- Sem isso, o modelo recebe o turno de IA vazio e pode tratar um "Olá" como contato novo.

update public.n8n_chat_histories
set message = jsonb_strip_nulls(
  jsonb_build_object(
    'type', coalesce(message->>'type', 'ai'),
    'content', message->'data'->>'content',
    'additional_kwargs', coalesce(message->'data'->'additional_kwargs', '{}'::jsonb),
    'response_metadata', coalesce(message->'data'->'response_metadata', '{}'::jsonb),
    'tool_calls', case
      when coalesce(message->>'type', 'ai') = 'ai' then coalesce(message->'data'->'tool_calls', '[]'::jsonb)
      else null
    end,
    'invalid_tool_calls', case
      when coalesce(message->>'type', 'ai') = 'ai' then coalesce(message->'data'->'invalid_tool_calls', '[]'::jsonb)
      else null
    end
  )
)
where message ? 'data'
  and jsonb_typeof(message->'data') = 'object'
  and (message->'data') ? 'content'
  and not (message ? 'content');
