-- Permite validação das RPCs via SQL admin (postgres) além de service_role/JWT.

create or replace function public.can_access_tenant_holiday_rpcs(p_tenant_id bigint)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_tenant_id is null then
    return false;
  end if;

  -- PostgREST service role (n8n / backend)
  if auth.role() = 'service_role' then
    return true;
  end if;

  -- SQL direto (migrations, MCP, psql) como postgres/supabase_admin
  if auth.uid() is null and current_user in ('postgres', 'supabase_admin') then
    return true;
  end if;

  if public.is_platform_admin() then
    return true;
  end if;

  return public.is_tenant_member(p_tenant_id);
end;
$$;
