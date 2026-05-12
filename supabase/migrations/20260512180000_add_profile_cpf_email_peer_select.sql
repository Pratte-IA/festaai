alter table public.profiles
  add column if not exists cpf text;

alter table public.profiles
  add column if not exists email text;

comment on column public.profiles.cpf is 'CPF do usuário (somente dígitos, 11 posições), replicado na criação pela função de equipe.';
comment on column public.profiles.email is 'E-mail de contato no diretório do tenant (espelho do auth no cadastro pela equipe).';

drop policy if exists "profiles_select_tenant_peers" on public.profiles;

create policy "profiles_select_tenant_peers"
on public.profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.tenant_members as tm_self
    join public.tenant_members as tm_peer
      on tm_self.tenant_id = tm_peer.tenant_id
    where tm_self.user_id = (select auth.uid())
      and tm_peer.user_id = profiles.id
      and tm_self.status = 'active'
      and tm_peer.status = 'active'
  )
);
