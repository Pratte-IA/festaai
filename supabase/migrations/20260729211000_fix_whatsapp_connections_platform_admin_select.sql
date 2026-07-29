-- Restaura leitura de conexões de tenant pelo platform admin
-- (política anterior foi estreita demais para scope=platform apenas).

drop policy if exists "whatsapp_connections_select_platform_admin" on public.whatsapp_connections;
create policy "whatsapp_connections_select_platform_admin"
on public.whatsapp_connections
for select to authenticated
using (public.is_platform_admin());
