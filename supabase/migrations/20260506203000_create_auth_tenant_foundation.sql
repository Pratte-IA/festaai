create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  document text,
  phone text,
  email text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tenants_status_check check (status in ('active', 'trialing', 'past_due', 'suspended', 'canceled')),
  constraint tenants_slug_format_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table if not exists public.tenant_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  status text not null default 'active',
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tenant_members_role_check check (role in ('owner', 'admin', 'member')),
  constraint tenant_members_status_check check (status in ('active', 'pending', 'disabled')),
  constraint tenant_members_tenant_user_unique unique (tenant_id, user_id)
);

create index if not exists tenant_members_tenant_id_idx on public.tenant_members (tenant_id);
create index if not exists tenant_members_user_id_idx on public.tenant_members (user_id);
create index if not exists tenant_members_active_lookup_idx on public.tenant_members (tenant_id, user_id) where status = 'active';
create index if not exists tenants_status_idx on public.tenants (status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_tenants_updated_at on public.tenants;
create trigger set_tenants_updated_at
before update on public.tenants
for each row
execute function public.set_updated_at();

drop trigger if exists set_tenant_members_updated_at on public.tenant_members;
create trigger set_tenant_members_updated_at
before update on public.tenant_members
for each row
execute function public.set_updated_at();

create or replace function public.is_tenant_member(target_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_members
    where tenant_id = target_tenant_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$;

create or replace function public.has_tenant_role(target_tenant_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_members
    where tenant_id = target_tenant_id
      and user_id = auth.uid()
      and status = 'active'
      and role = any(allowed_roles)
  );
$$;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row
execute function public.handle_new_user_profile();

insert into public.profiles (id, full_name, created_at, updated_at)
select
  id,
  nullif(raw_user_meta_data ->> 'full_name', ''),
  coalesce(created_at, now()),
  now()
from auth.users
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.tenants enable row level security;
alter table public.tenant_members enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "tenants_select_members" on public.tenants;
create policy "tenants_select_members"
on public.tenants
for select
to authenticated
using (public.is_tenant_member(id));

drop policy if exists "tenants_update_admins" on public.tenants;
create policy "tenants_update_admins"
on public.tenants
for update
to authenticated
using (public.has_tenant_role(id, array['owner', 'admin']))
with check (public.has_tenant_role(id, array['owner', 'admin']));

drop policy if exists "tenant_members_select_members" on public.tenant_members;
create policy "tenant_members_select_members"
on public.tenant_members
for select
to authenticated
using (public.is_tenant_member(tenant_id));

drop policy if exists "tenant_members_insert_admins" on public.tenant_members;
create policy "tenant_members_insert_admins"
on public.tenant_members
for insert
to authenticated
with check (public.has_tenant_role(tenant_id, array['owner', 'admin']));

drop policy if exists "tenant_members_update_admins" on public.tenant_members;
create policy "tenant_members_update_admins"
on public.tenant_members
for update
to authenticated
using (public.has_tenant_role(tenant_id, array['owner', 'admin']))
with check (public.has_tenant_role(tenant_id, array['owner', 'admin']));

drop policy if exists "tenant_members_delete_owners" on public.tenant_members;
create policy "tenant_members_delete_owners"
on public.tenant_members
for delete
to authenticated
using (public.has_tenant_role(tenant_id, array['owner']));
