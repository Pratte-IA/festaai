create policy "profiles_select_platform_admin"
on public.profiles
for select
to authenticated
using (public.is_platform_admin());

create policy "tenants_select_platform_admin"
on public.tenants
for select
to authenticated
using (public.is_platform_admin());

create policy "tenant_members_select_platform_admin"
on public.tenant_members
for select
to authenticated
using (public.is_platform_admin());

create policy "eventos_select_platform_admin"
on public.eventos
for select
to authenticated
using (public.is_platform_admin());

create policy "evento_pagamentos_select_platform_admin"
on public.evento_pagamentos
for select
to authenticated
using (public.is_platform_admin());

create policy "evento_tarefas_select_platform_admin"
on public.evento_tarefas
for select
to authenticated
using (public.is_platform_admin());

create policy "evento_notas_select_platform_admin"
on public.evento_notas
for select
to authenticated
using (public.is_platform_admin());

create policy "calendar_blocks_select_platform_admin"
on public.calendar_blocks
for select
to authenticated
using (public.is_platform_admin());

create policy "tenant_packages_select_platform_admin"
on public.tenant_packages
for select
to authenticated
using (public.is_platform_admin());

create policy "tenant_additionals_select_platform_admin"
on public.tenant_additionals
for select
to authenticated
using (public.is_platform_admin());

create policy "tenant_commercial_plans_select_platform_admin"
on public.tenant_commercial_plans
for select
to authenticated
using (public.is_platform_admin());

create policy "tenant_checklist_categories_select_platform_admin"
on public.tenant_checklist_categories
for select
to authenticated
using (public.is_platform_admin());

create policy "tenant_checklist_items_select_platform_admin"
on public.tenant_checklist_items
for select
to authenticated
using (public.is_platform_admin());

create policy "tenant_message_templates_select_platform_admin"
on public.tenant_message_templates
for select
to authenticated
using (public.is_platform_admin());

create policy "tenant_financial_settings_select_platform_admin"
on public.tenant_financial_settings
for select
to authenticated
using (public.is_platform_admin());

create policy "subscription_plans_select_platform_admin"
on public.subscription_plans
for select
to authenticated
using (public.is_platform_admin());

create policy "billing_customers_select_platform_admin"
on public.billing_customers
for select
to authenticated
using (public.is_platform_admin());

create policy "billing_subscriptions_select_platform_admin"
on public.billing_subscriptions
for select
to authenticated
using (public.is_platform_admin());

create policy "email_events_select_platform_admin"
on public.email_events
for select
to authenticated
using (public.is_platform_admin());
