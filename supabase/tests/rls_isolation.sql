begin;

insert into public.tenants (id, name, slug, status)
overriding system value
values
  (900001, 'Tenant RLS A', 'tenant-rls-a', 'active'),
  (900002, 'Tenant RLS B', 'tenant-rls-b', 'active');

insert into public.tenant_members (tenant_id, user_id, role, status)
select 900001, id, 'owner', 'active'
from auth.users
limit 1;

insert into public.profiles (id, is_platform_admin)
select id, true
from auth.users
limit 1
on conflict (id) do update set
  is_platform_admin = true,
  updated_at = now();

insert into public.eventos (tenant_id, cliente_nome, funil, etapa)
values
  (900001, 'Cliente Tenant A', 'vendas', 'contato_inicial'),
  (900002, 'Cliente Tenant B', 'vendas', 'contato_inicial');

select set_config('request.jwt.claim.sub', (select id::text from auth.users limit 1), true);
set local role authenticated;

do $$
declare
  visible_events integer;
  tenant_b_events integer;
begin
  if not public.is_platform_admin() then
    raise exception 'Platform admin helper failed: expected true';
  end if;

  select count(*) into visible_events from public.eventos where tenant_id in (900001, 900002);
  select count(*) into tenant_b_events from public.eventos where tenant_id = 900002;

  if visible_events <> 2 then
    raise exception 'Platform admin RLS failed: expected 2 visible events, got %', visible_events;
  end if;

  if tenant_b_events <> 1 then
    raise exception 'Platform admin RLS failed: tenant B data is not visible';
  end if;
end $$;

rollback;
