alter table public.profiles
  add column if not exists is_platform_admin boolean not null default false;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select profiles.is_platform_admin
      from public.profiles
      where profiles.id = (select auth.uid())
      limit 1
    ),
    false
  );
$$;

revoke execute on function public.is_platform_admin() from public, anon, authenticated;
grant execute on function public.is_platform_admin() to authenticated;

insert into public.profiles (id, full_name, created_at, updated_at, is_platform_admin)
select
  auth_users.id,
  nullif(auth_users.raw_user_meta_data ->> 'full_name', ''),
  coalesce(auth_users.created_at, now()),
  now(),
  true
from auth.users as auth_users
where lower(auth_users.email) = lower('contato@pratte.com.br')
on conflict (id) do update set
  is_platform_admin = true,
  updated_at = now();

-- If this insert affects no rows, create contato@pratte.com.br in Supabase Auth first.
-- Do not create the user's password in SQL migrations; then re-run this bootstrap
-- insert/update block manually or in a follow-up migration.
