-- Permite que a admin da plataforma configure N8N manualmente por tenant.

create policy "tenant_automation_settings_insert_platform_admin"
on public.tenant_automation_settings
for insert
to authenticated
with check (public.is_platform_admin());

create policy "tenant_automation_settings_update_platform_admin"
on public.tenant_automation_settings
for update
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());
