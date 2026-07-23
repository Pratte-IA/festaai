-- Go-live interno: só admin da plataforma arma automações/robôs do tenant.
-- Default false para tenants novos; Vila Encantada já ativa.

alter table public.tenant_automation_settings
  add column if not exists system_armed boolean not null default false,
  add column if not exists system_armed_at timestamptz;

comment on column public.tenant_automation_settings.system_armed is
  'Quando true, automações e robôs do tenant podem disparar. Controlado apenas por admin da plataforma.';

comment on column public.tenant_automation_settings.system_armed_at is
  'Momento em que system_armed passou a true (null se desativado).';

-- Garante linha de settings para todos os tenants (padrão: desarmado).
insert into public.tenant_automation_settings (tenant_id, system_armed)
select t.id, false
from public.tenants t
on conflict (tenant_id) do nothing;

-- Vila Encantada: já em produção — sistema ativo.
update public.tenant_automation_settings tas
set
  system_armed = true,
  system_armed_at = coalesce(tas.system_armed_at, now()),
  updated_at = now()
from public.tenants t
where t.id = tas.tenant_id
  and t.slug = 'vila-encantada';

-- Wekids e demais: desativado explicitamente.
update public.tenant_automation_settings tas
set
  system_armed = false,
  system_armed_at = null,
  updated_at = now()
from public.tenants t
where t.id = tas.tenant_id
  and t.slug is distinct from 'vila-encantada';

create or replace function public.enforce_system_armed_platform_admin_only()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  -- Sem JWT (migration / service_role): permitido. Com JWT: só platform admin.
  can_change_arm boolean := auth.uid() is null or public.is_platform_admin();
begin
  if tg_op = 'INSERT' then
    if new.system_armed is true and not can_change_arm then
      raise exception 'Apenas administradores da plataforma podem ativar o sistema do tenant.';
    end if;
    if new.system_armed is true and new.system_armed_at is null then
      new.system_armed_at := now();
    end if;
    if new.system_armed is false then
      new.system_armed_at := null;
    end if;
    return new;
  end if;

  if new.system_armed is distinct from old.system_armed then
    if not can_change_arm then
      raise exception 'Apenas administradores da plataforma podem alterar a ativação do sistema.';
    end if;
    if new.system_armed is true then
      new.system_armed_at := coalesce(new.system_armed_at, now());
    else
      new.system_armed_at := null;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_system_armed_platform_admin_only
  on public.tenant_automation_settings;

create trigger trg_enforce_system_armed_platform_admin_only
before insert or update on public.tenant_automation_settings
for each row
execute function public.enforce_system_armed_platform_admin_only();
