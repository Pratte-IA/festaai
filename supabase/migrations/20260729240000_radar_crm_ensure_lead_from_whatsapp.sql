-- Cria lead no CRM Comercial a partir de inbound do WhatsApp da plataforma,
-- quando o telefone ainda não existe na base Radar/CRM.
-- Se já existir empresa com o telefone, respeita a etapa atual do CRM.

create or replace function public.radar_crm_ensure_lead_from_whatsapp(
  p_phone_candidates text[],
  p_canonical_phone text,
  p_display_phone text,
  p_customer_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, radar
as $$
declare
  v_company_id bigint;
  v_name text;
  v_created boolean := false;
  v_crm radar.company_crm%rowtype;
  v_candidates text[];
begin
  if p_canonical_phone is null or btrim(p_canonical_phone) = '' then
    raise exception 'Telefone canônico obrigatório.';
  end if;

  v_candidates := (
    select coalesce(array_agg(distinct btrim(c)), array[]::text[])
    from unnest(coalesce(p_phone_candidates, array[]::text[]) || array[p_canonical_phone]) as c
    where nullif(btrim(c), '') is not null
  );

  if cardinality(v_candidates) = 0 then
    raise exception 'Nenhum telefone válido informado.';
  end if;

  -- 1) Já criado por este fluxo
  select mc.id
  into v_company_id
  from radar.market_companies mc
  where mc.provider = 'festaai_whatsapp'
    and mc.external_id = any (v_candidates)
  order by mc.id
  limit 1;

  -- 2) Contato normalizado
  if v_company_id is null then
    select cc.company_id
    into v_company_id
    from radar.company_contacts cc
    where cc.normalized_value = any (v_candidates)
    order by cc.company_id
    limit 1;
  end if;

  -- 3) Campos de telefone da empresa (digits only)
  if v_company_id is null then
    select mc.id
    into v_company_id
    from radar.market_companies mc
    where regexp_replace(coalesce(mc.whatsapp, ''), '\D', '', 'g') = any (v_candidates)
       or regexp_replace(coalesce(mc.phone, ''), '\D', '', 'g') = any (v_candidates)
       or regexp_replace(coalesce(mc.phone_unformatted, ''), '\D', '', 'g') = any (v_candidates)
    order by mc.id
    limit 1;
  end if;

  if v_company_id is null then
    v_name := coalesce(
      nullif(btrim(p_customer_name), ''),
      'Contato WhatsApp ' || coalesce(nullif(btrim(p_display_phone), ''), p_canonical_phone)
    );

    insert into radar.market_companies (
      provider,
      external_id,
      name,
      trade_name,
      whatsapp,
      phone,
      phone_unformatted,
      enrichment_status,
      cnpj_discovery_status
    )
    values (
      'festaai_whatsapp',
      p_canonical_phone,
      v_name,
      nullif(btrim(p_customer_name), ''),
      coalesce(nullif(btrim(p_display_phone), ''), p_canonical_phone),
      coalesce(nullif(btrim(p_display_phone), ''), p_canonical_phone),
      p_canonical_phone,
      'pending',
      'pending'
    )
    on conflict (provider, external_id) do update
      set
        name = case
          when nullif(btrim(excluded.name), '') is not null
            and radar.market_companies.name like 'Contato WhatsApp %'
            then excluded.name
          else radar.market_companies.name
        end,
        trade_name = coalesce(radar.market_companies.trade_name, excluded.trade_name),
        whatsapp = coalesce(radar.market_companies.whatsapp, excluded.whatsapp),
        updated_at = now()
    returning id into v_company_id;

    -- Se o ON CONFLICT não retornou (versão antiga), busca de novo
    if v_company_id is null then
      select mc.id
      into v_company_id
      from radar.market_companies mc
      where mc.provider = 'festaai_whatsapp'
        and mc.external_id = p_canonical_phone
      limit 1;
    end if;

    insert into radar.company_contacts (
      company_id,
      contact_type,
      raw_value,
      normalized_value,
      display_value,
      is_whatsapp,
      likely_whatsapp,
      is_primary,
      source,
      source_detail,
      confidence_score
    )
    values (
      v_company_id,
      'phone',
      coalesce(nullif(btrim(p_display_phone), ''), p_canonical_phone),
      p_canonical_phone,
      coalesce(nullif(btrim(p_display_phone), ''), p_canonical_phone),
      true,
      true,
      true,
      'festaai_whatsapp',
      'inbound_platform_whatsapp',
      90
    )
    on conflict (company_id, normalized_value) do update
      set
        is_whatsapp = true,
        likely_whatsapp = true,
        last_seen_at = now(),
        updated_at = now();

    -- Trigger cria company_crm como new_lead; mover para contato iniciado
    insert into radar.company_crm (company_id, status, priority, last_contact_at)
    values (v_company_id, 'contact_started', 'medium', now())
    on conflict (company_id) do update
      set
        status = case
          when radar.company_crm.status in ('new_lead', 'qualifying') then 'contact_started'
          else radar.company_crm.status
        end,
        last_contact_at = now(),
        updated_at = now();

    -- Garante status contact_started no primeiro inbound (mesmo se trigger já inseriu new_lead)
    update radar.company_crm
    set
      status = 'contact_started',
      last_contact_at = coalesce(last_contact_at, now()),
      updated_at = now()
    where company_id = v_company_id
      and status in ('new_lead', 'qualifying');

    insert into radar.company_crm_interactions (
      company_id,
      interaction_type,
      interaction_at,
      notes,
      outcome
    )
    values (
      v_company_id,
      'whatsapp',
      now(),
      'Contato iniciado via WhatsApp FestaAI (inbound).',
      'inbound'
    );

    v_created := true;
  else
    -- Empresa já existe: respeita etapa do CRM; só registra contato recente
    insert into radar.company_crm (company_id, status, priority, last_contact_at)
    values (v_company_id, 'contact_started', 'medium', now())
    on conflict (company_id) do update
      set
        last_contact_at = now(),
        updated_at = now();

    -- Garante contato whatsapp normalizado (não altera CRM status)
    insert into radar.company_contacts (
      company_id,
      contact_type,
      raw_value,
      normalized_value,
      display_value,
      is_whatsapp,
      likely_whatsapp,
      is_primary,
      source,
      source_detail,
      confidence_score
    )
    values (
      v_company_id,
      'phone',
      coalesce(nullif(btrim(p_display_phone), ''), p_canonical_phone),
      p_canonical_phone,
      coalesce(nullif(btrim(p_display_phone), ''), p_canonical_phone),
      true,
      true,
      false,
      'festaai_whatsapp',
      'inbound_platform_whatsapp_match',
      80
    )
    on conflict (company_id, normalized_value) do update
      set
        is_whatsapp = true,
        likely_whatsapp = true,
        last_seen_at = now(),
        updated_at = now();
  end if;

  select * into v_crm from radar.company_crm where company_id = v_company_id;

  return jsonb_build_object(
    'ok', true,
    'created', v_created,
    'companyId', v_company_id,
    'crmStatus', v_crm.status
  );
end;
$$;

revoke all on function public.radar_crm_ensure_lead_from_whatsapp(text[], text, text, text)
  from public, anon, authenticated;
grant execute on function public.radar_crm_ensure_lead_from_whatsapp(text[], text, text, text)
  to service_role;
