alter function public.set_updated_at() set search_path = public;
alter function public.match_documents(vector, integer, jsonb) set search_path = public;
alter function public.handle_new_user_profile() set search_path = public;
alter function public.is_tenant_member(bigint) set search_path = public;
alter function public.has_tenant_role(bigint, text[]) set search_path = public;

revoke execute on function public.handle_new_user_profile() from anon, authenticated;
revoke execute on function public.is_tenant_member(bigint) from anon;
revoke execute on function public.has_tenant_role(bigint, text[]) from anon;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = (select auth.uid()));

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (id = (select auth.uid()));

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "billing_webhook_events_no_client_access"
on public.billing_webhook_events
for all
to anon, authenticated
using (false)
with check (false);

create index if not exists billing_subscriptions_customer_id_idx on public.billing_subscriptions (customer_id);
create index if not exists billing_subscriptions_plan_id_idx on public.billing_subscriptions (plan_id);
create index if not exists calendar_blocks_created_by_idx on public.calendar_blocks (created_by);
create index if not exists calendar_blocks_updated_by_idx on public.calendar_blocks (updated_by);
create index if not exists eventos_updated_by_idx on public.eventos (updated_by);
create index if not exists tenant_members_invited_by_idx on public.tenant_members (invited_by);

create index if not exists evento_pagamentos_evento_tenant_idx on public.evento_pagamentos (evento_id, tenant_id);
create index if not exists evento_pagamentos_created_by_idx on public.evento_pagamentos (created_by);
create index if not exists evento_pagamentos_updated_by_idx on public.evento_pagamentos (updated_by);

create index if not exists evento_tarefas_evento_tenant_idx on public.evento_tarefas (evento_id, tenant_id);
create index if not exists evento_tarefas_created_by_idx on public.evento_tarefas (created_by);
create index if not exists evento_tarefas_updated_by_idx on public.evento_tarefas (updated_by);

create index if not exists evento_notas_evento_tenant_idx on public.evento_notas (evento_id, tenant_id);
create index if not exists evento_notas_created_by_idx on public.evento_notas (created_by);
create index if not exists evento_notas_updated_by_idx on public.evento_notas (updated_by);

create index if not exists tenant_packages_created_by_idx on public.tenant_packages (created_by);
create index if not exists tenant_packages_updated_by_idx on public.tenant_packages (updated_by);
create index if not exists tenant_additionals_created_by_idx on public.tenant_additionals (created_by);
create index if not exists tenant_additionals_updated_by_idx on public.tenant_additionals (updated_by);
create index if not exists tenant_commercial_plans_created_by_idx on public.tenant_commercial_plans (created_by);
create index if not exists tenant_commercial_plans_updated_by_idx on public.tenant_commercial_plans (updated_by);
create index if not exists tenant_checklist_categories_created_by_idx on public.tenant_checklist_categories (created_by);
create index if not exists tenant_checklist_categories_updated_by_idx on public.tenant_checklist_categories (updated_by);
create index if not exists tenant_checklist_items_category_tenant_idx on public.tenant_checklist_items (category_id, tenant_id);
create index if not exists tenant_checklist_items_created_by_idx on public.tenant_checklist_items (created_by);
create index if not exists tenant_checklist_items_updated_by_idx on public.tenant_checklist_items (updated_by);
create index if not exists tenant_message_templates_created_by_idx on public.tenant_message_templates (created_by);
create index if not exists tenant_message_templates_updated_by_idx on public.tenant_message_templates (updated_by);
create index if not exists tenant_financial_settings_created_by_idx on public.tenant_financial_settings (created_by);
create index if not exists tenant_financial_settings_updated_by_idx on public.tenant_financial_settings (updated_by);
