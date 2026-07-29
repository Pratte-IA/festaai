-- Fix: CTE `filtered` was referenced across separate SQL statements (Postgres scope error).
-- Rewrite list RPC to compute total/filtered/items in a single WITH query.

create or replace function public.radar_crm_list_companies(
  p_search text default null,
  p_statuses text[] default null,
  p_priorities text[] default null,
  p_city text default null,
  p_state text default null,
  p_category text default null,
  p_has_instagram boolean default null,
  p_has_phone boolean default null,
  p_has_whatsapp boolean default null,
  p_has_website boolean default null,
  p_cnpj_validated boolean default null,
  p_registration_active boolean default null,
  p_has_administrator boolean default null,
  p_assigned_user_id uuid default null,
  p_next_action_from timestamptz default null,
  p_next_action_to timestamptz default null,
  p_without_contact boolean default null,
  p_overdue_next_action boolean default null,
  p_page integer default 1,
  p_page_size integer default 25
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, radar
as $$
declare
  v_page integer := greatest(coalesce(p_page, 1), 1);
  v_page_size integer := least(greatest(coalesce(p_page_size, 25), 1), 100);
  v_offset integer;
  v_result jsonb;
begin
  if not public.is_platform_admin() then
    raise exception 'Acesso negado: apenas administradores da plataforma.';
  end if;

  v_offset := (v_page - 1) * v_page_size;

  with base as (
    select
      mc.id, mc.name, mc.category, mc.city, mc.state, mc.address, mc.phone, mc.phone_unformatted,
      mc.whatsapp, mc.website, mc.instagram_url, mc.facebook_url, mc.tiktok_url, mc.linkedin_url,
      mc.email, mc.rating, mc.reviews_count, mc.google_maps_url, mc.cnpj, mc.cnpj_formatted,
      mc.cnpj_validation_status,
      mc.legal_name as company_legal_name,
      mc.trade_name as company_trade_name,
      cand.legal_name as candidate_legal_name,
      cand.trade_name as candidate_trade_name,
      cand.cnpj_data ->> 'legal_name' as cnpj_legal_name,
      cand.cnpj_data ->> 'trade_name' as cnpj_trade_name,
      cand.cnpj_data ->> 'registration_status' as cnpj_registration_status,
      cand.cnpj_data ->> 'registration_status_normalized' as cnpj_registration_status_normalized,
      case
        when lower(coalesce(cand.cnpj_data ->> 'is_active', '')) in ('true','t','1') then true
        when lower(coalesce(cand.cnpj_data ->> 'is_active', '')) in ('false','f','0') then false
        else null
      end as cnpj_is_active,
      coalesce(crm.status, 'new') as crm_status,
      coalesce(crm.priority, 'medium') as crm_priority,
      crm.assigned_user_id, crm.last_contact_at, crm.next_action_at, crm.next_action_description,
      coalesce(crm.do_not_contact, false) as do_not_contact,
      crm.lost_reason,
      assignee.full_name as assigned_user_name,
      assignee.email as assigned_user_email,
      (select count(*)::int from radar.company_partners cp where cp.company_id = mc.id) as partners_count,
      (select count(*)::int from radar.company_partners cp where cp.company_id = mc.id and cp.is_administrator = true) as administrators_count,
      (
        select jsonb_build_object(
          'id', cp.id, 'name', cp.partner_name, 'qualification', cp.qualification,
          'is_administrator', cp.is_administrator,
          'is_probable_decision_maker', cp.is_probable_decision_maker,
          'decision_priority', cp.decision_priority
        )
        from radar.company_partners cp
        where cp.company_id = mc.id
        order by cp.decision_priority asc nulls last, cp.is_administrator desc,
                 cp.is_probable_decision_maker desc, cp.partner_name asc
        limit 1
      ) as primary_decision_maker,
      (
        select cc.display_value from radar.company_contacts cc
        where cc.company_id = mc.id and (cc.is_whatsapp = true or cc.likely_whatsapp = true)
        order by cc.is_whatsapp desc, cc.is_primary desc, cc.contact_order nulls last, cc.id
        limit 1
      ) as whatsapp_display,
      (
        exists (
          select 1 from radar.company_contacts cc
          where cc.company_id = mc.id and (cc.is_whatsapp = true or cc.likely_whatsapp = true)
        ) or nullif(btrim(coalesce(mc.whatsapp, '')), '') is not null
      ) as has_whatsapp,
      nullif(btrim(coalesce(mc.instagram_url, '')), '') is not null as has_instagram,
      (
        nullif(btrim(coalesce(mc.phone, '')), '') is not null
        or nullif(btrim(coalesce(mc.phone_unformatted, '')), '') is not null
        or exists (select 1 from radar.company_contacts cc where cc.company_id = mc.id)
      ) as has_phone,
      nullif(btrim(coalesce(mc.website, '')), '') is not null as has_website,
      (mc.cnpj_validation_status = 'validated' and mc.cnpj is not null) as cnpj_validated,
      exists (
        select 1 from radar.company_partners cp
        where cp.company_id = mc.id and cp.is_administrator = true
      ) as has_administrator
    from radar.market_companies mc
    left join radar.company_crm crm on crm.company_id = mc.id
    left join public.profiles assignee on assignee.id = crm.assigned_user_id
    left join lateral (
      select c.* from radar.company_cnpj_candidates c
      where c.company_id = mc.id and c.is_selected = true
      order by c.validated_at desc nulls last, c.id desc
      limit 1
    ) cand on true
  ),
  filtered as (
    select * from base b
    where radar.crm_company_matches_search(b.id, p_search)
      and (p_statuses is null or cardinality(p_statuses) = 0 or radar.crm_effective_status(b.crm_status, b.do_not_contact) = any (p_statuses))
      and (p_priorities is null or cardinality(p_priorities) = 0 or b.crm_priority = any (p_priorities))
      and (p_city is null or btrim(p_city) = '' or lower(coalesce(b.city, '')) = lower(btrim(p_city)))
      and (p_state is null or btrim(p_state) = '' or lower(coalesce(b.state, '')) = lower(btrim(p_state)))
      and (p_category is null or btrim(p_category) = '' or lower(coalesce(b.category, '')) = lower(btrim(p_category)))
      and (p_has_instagram is null or b.has_instagram = p_has_instagram)
      and (p_has_phone is null or b.has_phone = p_has_phone)
      and (p_has_whatsapp is null or b.has_whatsapp = p_has_whatsapp)
      and (p_has_website is null or b.has_website = p_has_website)
      and (p_cnpj_validated is null or b.cnpj_validated = p_cnpj_validated)
      and (
        p_registration_active is null
        or (p_registration_active = true and (
          coalesce(b.cnpj_is_active, false) = true
          or lower(coalesce(b.cnpj_registration_status_normalized, '')) = 'ativa'
          or lower(coalesce(b.cnpj_registration_status, '')) = 'ativa'
        ))
        or (p_registration_active = false and not (
          coalesce(b.cnpj_is_active, false) = true
          or lower(coalesce(b.cnpj_registration_status_normalized, '')) = 'ativa'
          or lower(coalesce(b.cnpj_registration_status, '')) = 'ativa'
        ))
      )
      and (p_has_administrator is null or b.has_administrator = p_has_administrator)
      and (p_assigned_user_id is null or b.assigned_user_id = p_assigned_user_id)
      and (p_next_action_from is null or b.next_action_at >= p_next_action_from)
      and (p_next_action_to is null or b.next_action_at <= p_next_action_to)
      and (p_without_contact is null or p_without_contact = false or b.last_contact_at is null)
      and (p_overdue_next_action is null or p_overdue_next_action = false or (b.next_action_at is not null and b.next_action_at < now()))
  ),
  page_rows as (
    select
      f.id, f.name,
      coalesce(nullif(f.cnpj_legal_name, ''), nullif(f.candidate_legal_name, ''), nullif(f.company_legal_name, '')) as legal_name,
      coalesce(nullif(f.cnpj_trade_name, ''), nullif(f.candidate_trade_name, ''), nullif(f.company_trade_name, '')) as trade_name,
      f.category, f.city, f.state, f.address, f.phone, f.phone_unformatted,
      coalesce(f.whatsapp_display, f.whatsapp) as whatsapp, f.has_whatsapp,
      f.website, f.instagram_url, f.facebook_url, f.tiktok_url, f.linkedin_url, f.email,
      f.rating, f.reviews_count, f.google_maps_url, f.cnpj, f.cnpj_formatted,
      f.cnpj_validated, f.cnpj_validation_status, f.cnpj_registration_status,
      f.has_instagram, f.has_phone, f.has_website, f.has_administrator,
      f.partners_count, f.administrators_count, f.primary_decision_maker,
      radar.crm_effective_status(f.crm_status, f.do_not_contact) as status,
      f.crm_priority as priority, f.assigned_user_id, f.assigned_user_name, f.assigned_user_email,
      f.last_contact_at, f.next_action_at, f.next_action_description, f.do_not_contact, f.lost_reason,
      (f.next_action_at is not null and f.next_action_at < now()) as next_action_overdue
    from filtered f
    order by f.name asc, f.id asc
    offset v_offset limit v_page_size
  )
  select jsonb_build_object(
    'total', (select count(*)::int from radar.market_companies),
    'filtered', (select count(*)::int from filtered),
    'page', v_page,
    'page_size', v_page_size,
    'items', coalesce(
      (select jsonb_agg(to_jsonb(page_rows) order by page_rows.name asc, page_rows.id asc) from page_rows),
      '[]'::jsonb
    )
  )
  into v_result;

  return v_result;
end;
$$;

revoke all on function public.radar_crm_list_companies(
  text, text[], text[], text, text, text, boolean, boolean, boolean, boolean,
  boolean, boolean, boolean, uuid, timestamptz, timestamptz, boolean, boolean, integer, integer
) from public, anon;
grant execute on function public.radar_crm_list_companies(
  text, text[], text[], text, text, text, boolean, boolean, boolean, boolean,
  boolean, boolean, boolean, uuid, timestamptz, timestamptz, boolean, boolean, integer, integer
) to authenticated;
