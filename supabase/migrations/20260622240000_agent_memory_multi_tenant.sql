-- Memória multi-tenant do agente: histórico n8n (LangChain) + espelho FestaAI com RLS.

-- Tabela usada pelo node Postgres Chat Memory do n8n (criada pelo n8n se ausente).
create table if not exists public.n8n_chat_histories (
  id serial primary key,
  session_id varchar not null,
  message jsonb not null
);

alter table public.n8n_chat_histories
  add column if not exists created_at timestamptz not null default now();

create index if not exists n8n_chat_histories_session_id_idx
  on public.n8n_chat_histories (session_id);

create index if not exists n8n_chat_histories_tenant_prefix_idx
  on public.n8n_chat_histories (split_part(session_id, ':', 1), session_id);

comment on table public.n8n_chat_histories is
  'Histórico de chat LangChain/n8n. session_id = tenant_id:customer_phone para isolamento multi-tenant.';

-- Espelho operacional para consulta no FestaAI (CRM, suporte, auditoria).
create table public.agent_conversation_messages (
  id bigint generated always as identity primary key,
  tenant_id bigint not null references public.tenants (id) on delete cascade,
  connection_id bigint references public.whatsapp_connections (id) on delete set null,
  customer_phone text not null,
  session_id text not null,
  role text not null,
  content text not null,
  message_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint agent_conversation_messages_role_check check (
    role in ('human', 'ai', 'system')
  )
);

create index agent_conversation_messages_tenant_session_created_idx
  on public.agent_conversation_messages (tenant_id, session_id, created_at desc);

create index agent_conversation_messages_tenant_phone_created_idx
  on public.agent_conversation_messages (tenant_id, customer_phone, created_at desc);

create unique index agent_conversation_messages_tenant_message_dedupe_idx
  on public.agent_conversation_messages (tenant_id, message_id)
  where message_id is not null;

comment on table public.agent_conversation_messages is
  'Mensagens espelhadas do agente WhatsApp por tenant; session_id = tenant_id:customer_phone.';

comment on column public.agent_conversation_messages.session_id is
  'Chave de sessão compartilhada com n8n Postgres Chat Memory (tenant_id:telefone).';

-- RLS: n8n_chat_histories (leitura por tenant via prefixo da session_id).
alter table public.n8n_chat_histories enable row level security;

drop policy if exists "n8n_chat_histories_select_tenant_member" on public.n8n_chat_histories;
create policy "n8n_chat_histories_select_tenant_member"
on public.n8n_chat_histories
for select
to authenticated
using (
  split_part(session_id, ':', 1) ~ '^\d+$'
  and public.is_tenant_member (split_part(session_id, ':', 1)::bigint)
);

drop policy if exists "n8n_chat_histories_select_platform_admin" on public.n8n_chat_histories;
create policy "n8n_chat_histories_select_platform_admin"
on public.n8n_chat_histories
for select
to authenticated
using (public.is_platform_admin ());

revoke insert, update, delete on table public.n8n_chat_histories from anon, authenticated;
grant select on table public.n8n_chat_histories to authenticated;
grant all on table public.n8n_chat_histories to service_role;

-- RLS: agent_conversation_messages.
alter table public.agent_conversation_messages enable row level security;

create policy "agent_conversation_messages_select_tenant_member"
on public.agent_conversation_messages
for select
to authenticated
using (public.is_tenant_member (tenant_id));

create policy "agent_conversation_messages_select_platform_admin"
on public.agent_conversation_messages
for select
to authenticated
using (public.is_platform_admin ());

revoke insert, update, delete on table public.agent_conversation_messages from anon, authenticated;
grant select on table public.agent_conversation_messages to authenticated;
grant all on table public.agent_conversation_messages to service_role;

-- Limpeza periódica (executar manualmente ou via pg_cron).
create or replace function public.purge_agent_chat_memory(retention_days integer default 90)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_n8n bigint := 0;
  deleted_mirror bigint := 0;
begin
  if retention_days < 7 then
    raise exception 'retention_days must be >= 7';
  end if;

  delete from public.n8n_chat_histories
  where created_at < now() - make_interval(days => retention_days);
  get diagnostics deleted_n8n = row_count;

  delete from public.agent_conversation_messages
  where created_at < now() - make_interval(days => retention_days);
  get diagnostics deleted_mirror = row_count;

  return jsonb_build_object(
    'retention_days', retention_days,
    'deleted_n8n_chat_histories', deleted_n8n,
    'deleted_agent_conversation_messages', deleted_mirror,
    'purged_at', now()
  );
end;
$$;

comment on function public.purge_agent_chat_memory(integer) is
  'Remove histórico antigo do agente (n8n + espelho FestaAI). Padrão: 90 dias.';

revoke all on function public.purge_agent_chat_memory(integer) from public;
grant execute on function public.purge_agent_chat_memory(integer) to service_role;
