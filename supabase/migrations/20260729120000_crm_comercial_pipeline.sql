-- CRM Comercial: novo funil, trigger automático, backfill e RPC Kanban.
-- Evolui radar.company_crm existente (0 linhas comerciais no momento da criação).

-- ---------------------------------------------------------------------------
-- 1) Ajustes na tabela company_crm
-- ---------------------------------------------------------------------------

alter table radar.company_crm
  add column if not exists notes text;

-- Remapear status legados (idempotente; seguro com 0 ou N linhas)
update radar.company_crm
set status = case status
  when 'new' then 'new_lead'
  when 'prospecting' then 'qualifying'
  when 'contacted' then 'contact_started'
  when 'responded' then 'in_conversation'
  when 'meeting_scheduled' then 'demo_scheduled'
  when 'proposal_sent' then 'proposal_sent'
  when 'won' then 'won'
  when 'lost' then 'lost'
  when 'do_not_contact' then 'lost'
  else status
end
where status in (
  'new', 'prospecting', 'contacted', 'responded', 'meeting_scheduled', 'do_not_contact'
);

-- do_not_contact legado virou lost + flag
update radar.company_crm
set
  do_not_contact = true,
  lost_reason = coalesce(nullif(btrim(lost_reason), ''), 'Não contatar')
where status = 'lost'
  and lost_reason is null
  and do_not_contact = true;

alter table radar.company_crm
  alter column status set default 'new_lead';

alter table radar.company_crm
  alter column priority drop not null;

alter table radar.company_crm
  drop constraint if exists company_crm_status_check;

alter table radar.company_crm
  add constraint company_crm_status_check
  check (
    status = any (
      array[
        'new_lead',
        'qualifying',
        'contact_started',
        'in_conversation',
        'demo_scheduled',
        'proposal_sent',
        'negotiating',
        'won',
        'lost'
      ]
    )
  );

alter table radar.company_crm
  drop constraint if exists company_crm_priority_check;

alter table radar.company_crm
  add constraint company_crm_priority_check
  check (
    priority is null
    or priority = any (array['high', 'medium', 'low'])
  );

-- ---------------------------------------------------------------------------
-- 2) Trigger: toda nova empresa entra como new_lead
-- ---------------------------------------------------------------------------

create or replace function radar.create_company_crm_record()
returns trigger
language plpgsql
security definer
set search_path = radar, public
as $$
begin
  insert into radar.company_crm (company_id, status, priority)
  values (new.id, 'new_lead', 'medium')
  on conflict (company_id) do nothing;

  return new;
end;
$$;

drop trigger if exists trigger_create_company_crm on radar.market_companies;

create trigger trigger_create_company_crm
after insert on radar.market_companies
for each row
execute function radar.create_company_crm_record();

revoke all on function radar.create_company_crm_record() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3) Backfill idempotente
-- ---------------------------------------------------------------------------

insert into radar.company_crm (company_id, status, priority)
select mc.id, 'new_lead', 'medium'
from radar.market_companies mc
left join radar.company_crm crm on crm.company_id = mc.id
where crm.id is null;

-- ---------------------------------------------------------------------------
-- 4) Helpers de status efetivo
-- ---------------------------------------------------------------------------

create or replace function radar.crm_effective_status(p_status text, p_do_not_contact boolean)
returns text
language sql
immutable
as $$
  select case
    when p_status is null or btrim(p_status) = '' then 'new_lead'
    else p_status
  end;
$$;

-- ---------------------------------------------------------------------------
-- 5) Atualizar upsert para novos status
-- ---------------------------------------------------------------------------

create or replace function public.radar_crm_upsert_company(
  p_company_id bigint,
  p_status text default null,
  p_priority text default null,
  p_assigned_user_id uuid default null,
  p_clear_assigned_user boolean default false,
  p_next_action_at timestamptz default null,
  p_clear_next_action boolean default false,
  p_next_action_description text default null,
  p_lost_reason text default null,
  p_do_not_contact boolean default null,
  p_last_contact_at timestamptz default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, radar
as $$
declare
  v_row radar.company_crm%rowtype;
  v_status text;
begin
  if not public.is_platform_admin() then
    raise exception 'Acesso negado: apenas administradores da plataforma.';
  end if;

  if not exists (select 1 from radar.market_companies where id = p_company_id) then
    raise exception 'Empresa não encontrada.';
  end if;

  insert into radar.company_crm (company_id, status, priority)
  values (p_company_id, 'new_lead', 'medium')
  on conflict (company_id) do nothing;

  select * into v_row from radar.company_crm where company_id = p_company_id for update;

  v_status := coalesce(p_status, v_row.status);

  if v_status = 'lost' and nullif(btrim(coalesce(p_lost_reason, v_row.lost_reason, '')), '') is null then
    raise exception 'Informe o motivo da perda ao marcar como Perdido.';
  end if;

  update radar.company_crm
  set
    status = v_status,
    priority = case
      when p_priority is not null then p_priority
      else priority
    end,
    assigned_user_id = case
      when p_clear_assigned_user then null
      when p_assigned_user_id is not null then p_assigned_user_id
      else assigned_user_id
    end,
    next_action_at = case
      when p_clear_next_action then null
      when p_next_action_at is not null then p_next_action_at
      else next_action_at
    end,
    next_action_description = case
      when p_clear_next_action then null
      when p_next_action_description is not null then p_next_action_description
      else next_action_description
    end,
    lost_reason = case
      when v_status = 'lost' then coalesce(nullif(btrim(p_lost_reason), ''), lost_reason)
      when p_status is not null and p_status <> 'lost' then null
      else lost_reason
    end,
    do_not_contact = coalesce(p_do_not_contact, do_not_contact),
    notes = case
      when p_notes is not null then p_notes
      else notes
    end,
    last_contact_at = coalesce(p_last_contact_at, last_contact_at),
    updated_at = now()
  where company_id = p_company_id
  returning * into v_row;

  return to_jsonb(v_row);
end;
$$;

revoke all on function public.radar_crm_upsert_company(
  bigint, text, text, uuid, boolean, timestamptz, boolean, text, text, boolean, timestamptz, text
) from public, anon;
grant execute on function public.radar_crm_upsert_company(
  bigint, text, text, uuid, boolean, timestamptz, boolean, text, text, boolean, timestamptz, text
) to authenticated;

-- Drop old overload without p_notes if it still exists
do $$
begin
  begin
    revoke all on function public.radar_crm_upsert_company(
      bigint, text, text, uuid, boolean, timestamptz, boolean, text, text, boolean, timestamptz
    ) from public, anon, authenticated;
  exception when undefined_function then
    null;
  end;

  begin
    drop function if exists public.radar_crm_upsert_company(
      bigint, text, text, uuid, boolean, timestamptz, boolean, text, text, boolean, timestamptz
    );
  exception when undefined_function then
    null;
  end;
end $$;

-- ---------------------------------------------------------------------------
-- 6) RPC Kanban agregado
-- ---------------------------------------------------------------------------

create or replace function public.radar_crm_kanban_board(
  p_search text default null,
  p_priorities text[] default null,
  p_city text default null,
  p_state text default null,
  p_category text default null,
  p_has_instagram boolean default null,
  p_has_phone boolean default null,
  p_has_whatsapp boolean default null,
  p_has_administrator boolean default null,
  p_assigned_user_id uuid default null,
  p_overdue_next_action boolean default null,
  p_next_action_today boolean default null,
  p_next_action_week boolean default null,
  p_without_next_action boolean default null,
  p_without_contact boolean default null,
  p_do_not_contact boolean default null,
  p_entered_from timestamptz default null,
  p_entered_to timestamptz default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, radar
as $$
declare
  v_result jsonb;
begin
  if not public.is_platform_admin() then
    raise exception 'Acesso negado: apenas administradores da plataforma.';
  end if;

  with base as (
    select
      mc.id,
      mc.name,
      mc.category,
      mc.city,
      mc.state,
      mc.phone,
      mc.phone_unformatted,
      mc.whatsapp,
      mc.website,
      mc.instagram_url,
      mc.rating,
      mc.reviews_count,
      mc.cnpj,
      mc.cnpj_formatted,
      crm.status as crm_status,
      coalesce(crm.priority, 'medium') as crm_priority,
      crm.assigned_user_id,
      crm.last_contact_at,
      crm.next_action_at,
      crm.next_action_description,
      crm.lost_reason,
      crm.notes,
      crm.do_not_contact,
      crm.created_at as crm_created_at,
      assignee.full_name as assigned_user_name,
      assignee.email as assigned_user_email,
      (
        select count(*)::int from radar.company_partners cp where cp.company_id = mc.id
      ) as partners_count,
      (
        select count(*)::int
        from radar.company_partners cp
        where cp.company_id = mc.id and cp.is_administrator = true
      ) as administrators_count,
      (
        select jsonb_build_object(
          'id', cp.id,
          'name', cp.partner_name,
          'qualification', cp.qualification,
          'is_administrator', cp.is_administrator,
          'is_probable_decision_maker', cp.is_probable_decision_maker,
          'decision_priority', cp.decision_priority
        )
        from radar.company_partners cp
        where cp.company_id = mc.id
        order by
          cp.decision_priority asc nulls last,
          cp.is_administrator desc,
          cp.is_probable_decision_maker desc,
          cp.partner_name asc
        limit 1
      ) as primary_decision_maker,
      (
        select cc.display_value
        from radar.company_contacts cc
        where cc.company_id = mc.id
          and (cc.is_whatsapp = true or cc.likely_whatsapp = true)
        order by cc.is_whatsapp desc, cc.is_primary desc, cc.contact_order nulls last, cc.id
        limit 1
      ) as whatsapp_display,
      (
        exists (
          select 1 from radar.company_contacts cc
          where cc.company_id = mc.id
            and (cc.is_whatsapp = true or cc.likely_whatsapp = true)
        ) or nullif(btrim(coalesce(mc.whatsapp, '')), '') is not null
      ) as has_whatsapp,
      nullif(btrim(coalesce(mc.instagram_url, '')), '') is not null as has_instagram,
      (
        nullif(btrim(coalesce(mc.phone, '')), '') is not null
        or nullif(btrim(coalesce(mc.phone_unformatted, '')), '') is not null
        or exists (select 1 from radar.company_contacts cc where cc.company_id = mc.id)
      ) as has_phone,
      exists (
        select 1 from radar.company_partners cp
        where cp.company_id = mc.id and cp.is_administrator = true
      ) as has_administrator,
      (
        select jsonb_build_object(
          'id', i.id,
          'interaction_type', i.interaction_type,
          'interaction_at', i.interaction_at,
          'notes', i.notes
        )
        from radar.company_crm_interactions i
        where i.company_id = mc.id
        order by i.interaction_at desc, i.id desc
        limit 1
      ) as last_interaction
    from radar.company_crm crm
    join radar.market_companies mc on mc.id = crm.company_id
    left join public.profiles assignee on assignee.id = crm.assigned_user_id
  ),
  filtered as (
    select *
    from base b
    where radar.crm_company_matches_search(b.id, p_search)
      and (p_priorities is null or cardinality(p_priorities) = 0 or b.crm_priority = any (p_priorities))
      and (p_city is null or btrim(p_city) = '' or lower(coalesce(b.city, '')) = lower(btrim(p_city)))
      and (p_state is null or btrim(p_state) = '' or lower(coalesce(b.state, '')) = lower(btrim(p_state)))
      and (p_category is null or btrim(p_category) = '' or lower(coalesce(b.category, '')) = lower(btrim(p_category)))
      and (p_has_instagram is null or b.has_instagram = p_has_instagram)
      and (p_has_phone is null or b.has_phone = p_has_phone)
      and (p_has_whatsapp is null or b.has_whatsapp = p_has_whatsapp)
      and (p_has_administrator is null or b.has_administrator = p_has_administrator)
      and (p_assigned_user_id is null or b.assigned_user_id = p_assigned_user_id)
      and (p_overdue_next_action is null or p_overdue_next_action = false or (b.next_action_at is not null and b.next_action_at < now()))
      and (
        p_next_action_today is null or p_next_action_today = false
        or (
          b.next_action_at is not null
          and b.next_action_at::date = (timezone('America/Sao_Paulo', now()))::date
        )
      )
      and (
        p_next_action_week is null or p_next_action_week = false
        or (
          b.next_action_at is not null
          and b.next_action_at::date >= (timezone('America/Sao_Paulo', now()))::date
          and b.next_action_at::date < (timezone('America/Sao_Paulo', now()))::date + 7
        )
      )
      and (p_without_next_action is null or p_without_next_action = false or b.next_action_at is null)
      and (p_without_contact is null or p_without_contact = false or b.last_contact_at is null)
      and (p_do_not_contact is null or b.do_not_contact = p_do_not_contact)
      and (p_entered_from is null or b.crm_created_at >= p_entered_from)
      and (p_entered_to is null or b.crm_created_at <= p_entered_to)
  ),
  cards as (
    select
      f.id,
      f.name,
      f.category,
      f.city,
      f.state,
      f.phone,
      f.phone_unformatted,
      coalesce(f.whatsapp_display, f.whatsapp) as whatsapp,
      f.has_whatsapp,
      f.website,
      f.instagram_url,
      f.has_instagram,
      f.has_phone,
      f.has_administrator,
      f.rating,
      f.reviews_count,
      f.cnpj,
      f.cnpj_formatted,
      f.partners_count,
      f.administrators_count,
      f.primary_decision_maker,
      radar.crm_effective_status(f.crm_status, f.do_not_contact) as status,
      f.crm_priority as priority,
      f.assigned_user_id,
      f.assigned_user_name,
      f.assigned_user_email,
      f.last_contact_at,
      f.next_action_at,
      f.next_action_description,
      f.lost_reason,
      f.notes,
      f.do_not_contact,
      f.crm_created_at,
      f.last_interaction,
      (f.next_action_at is not null and f.next_action_at < now()) as next_action_overdue
    from filtered f
  )
  select jsonb_build_object(
    'total', (select count(*)::int from radar.company_crm),
    'filtered', (select count(*)::int from cards),
    'counts', (
      select jsonb_object_agg(status_key, cnt)
      from (
        select s.status_key, count(c.id)::int as cnt
        from (
          select unnest(array[
            'new_lead','qualifying','contact_started','in_conversation',
            'demo_scheduled','proposal_sent','negotiating','won','lost'
          ]) as status_key
        ) s
        left join cards c on c.status = s.status_key
        group by s.status_key
      ) q
    ),
    'items', coalesce(
      (select jsonb_agg(to_jsonb(cards) order by cards.next_action_overdue desc nulls last, cards.name asc)
       from cards),
      '[]'::jsonb
    )
  )
  into v_result;

  return v_result;
end;
$$;

revoke all on function public.radar_crm_kanban_board(
  text, text[], text, text, text, boolean, boolean, boolean, boolean, uuid,
  boolean, boolean, boolean, boolean, boolean, boolean, timestamptz, timestamptz
) from public, anon;
grant execute on function public.radar_crm_kanban_board(
  text, text[], text, text, text, boolean, boolean, boolean, boolean, uuid,
  boolean, boolean, boolean, boolean, boolean, boolean, timestamptz, timestamptz
) to authenticated;
