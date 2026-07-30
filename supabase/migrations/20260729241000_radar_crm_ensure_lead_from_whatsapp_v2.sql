-- Ajusta ensure lead WhatsApp → CRM:
-- - matching robusto contra todos os contatos/campos de telefone
-- - se já no CRM em new_lead/qualifying → move para contact_started
-- - demais etapas permanecem
-- - novo lead cria market_companies + company_contacts + company_crm alinhados

create or replace function radar.phone_digit_variants(p_phone text)
returns text[]
language plpgsql
immutable
as $$
declare
  v_digits text;
  v_national text;
  v_ddd text;
  v_local text;
  v_out text[] := array[]::text[];
begin
  v_digits := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  if v_digits = '' then
    return v_out;
  end if;

  v_out := array_append(v_out, v_digits);

  if left(v_digits, 2) = '55' and length(v_digits) >= 12 then
    v_national := substring(v_digits from 3);
  else
    v_national := v_digits;
  end if;

  if length(v_national) between 10 and 11 then
    v_out := array_append(v_out, v_national);
    v_out := array_append(v_out, '55' || v_national);

    v_ddd := left(v_national, 2);
    v_local := substring(v_national from 3);

    -- Com nono dígito (celular BR)
    if length(v_local) = 8 and left(v_local, 1) in ('6', '7', '8', '9') then
      v_out := array_append(v_out, v_ddd || '9' || v_local);
      v_out := array_append(v_out, '55' || v_ddd || '9' || v_local);
    end if;

    -- Sem nono dígito (chave Evolution / WhatsApp)
    if length(v_local) = 9 and left(v_local, 1) = '9' then
      v_out := array_append(v_out, v_ddd || substring(v_local from 2));
      v_out := array_append(v_out, '55' || v_ddd || substring(v_local from 2));
    end if;
  end if;

  return (
    select coalesce(array_agg(distinct x), array[]::text[])
    from unnest(v_out) as x
    where nullif(btrim(x), '') is not null
  );
end;
$$;

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
  v_moved boolean := false;
  v_previous_status text;
  v_crm radar.company_crm%rowtype;
  v_candidates text[];
  v_me_phone text;
  v_candidate text;
begin
  if p_canonical_phone is null or btrim(p_canonical_phone) = '' then
    raise exception 'Telefone canônico obrigatório.';
  end if;

  -- Expande variantes (com/sem 55, com/sem nono dígito) a partir de todos os candidatos
  v_candidates := array[]::text[];
  foreach v_candidate in array coalesce(p_phone_candidates, array[]::text[]) || array[p_canonical_phone, p_display_phone]
  loop
    v_candidates := v_candidates || radar.phone_digit_variants(v_candidate);
  end loop;

  select coalesce(array_agg(distinct c), array[]::text[])
  into v_candidates
  from unnest(v_candidates) as c
  where nullif(btrim(c), '') is not null;

  if cardinality(v_candidates) = 0 then
    raise exception 'Nenhum telefone válido informado.';
  end if;

  -- Preferência de exibição / contato "com nono dígito" quando existir
  select c
  into v_me_phone
  from unnest(v_candidates) as c
  where length(c) = 13 and left(c, 2) = '55'
  order by c
  limit 1;

  v_me_phone := coalesce(v_me_phone, p_canonical_phone);

  -- 1) Lead já criado por este fluxo
  select mc.id
  into v_company_id
  from radar.market_companies mc
  where mc.provider = 'festaai_whatsapp'
    and (
      mc.external_id = any (v_candidates)
      or regexp_replace(coalesce(mc.external_id, ''), '\D', '', 'g') = any (v_candidates)
    )
  order by mc.id
  limit 1;

  -- 2) Qualquer contato do cliente (normalized / raw / display)
  if v_company_id is null then
    select cc.company_id
    into v_company_id
    from radar.company_contacts cc
    where
      regexp_replace(coalesce(cc.normalized_value, ''), '\D', '', 'g') = any (v_candidates)
      or regexp_replace(coalesce(cc.raw_value, ''), '\D', '', 'g') = any (v_candidates)
      or regexp_replace(coalesce(cc.display_value, ''), '\D', '', 'g') = any (v_candidates)
    order by
      case when cc.is_whatsapp or cc.likely_whatsapp then 0 else 1 end,
      case when cc.is_primary then 0 else 1 end,
      cc.company_id
    limit 1;
  end if;

  -- 3) Campos de telefone da empresa
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
    v_created := true;
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

    if v_company_id is null then
      select mc.id
      into v_company_id
      from radar.market_companies mc
      where mc.provider = 'festaai_whatsapp'
        and mc.external_id = p_canonical_phone
      limit 1;
    end if;

    -- Contato canônico Evolution (sem nono) + variante wa.me (com nono), se diferente
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

    if v_me_phone is distinct from p_canonical_phone then
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
        coalesce(nullif(btrim(p_display_phone), ''), v_me_phone),
        v_me_phone,
        coalesce(nullif(btrim(p_display_phone), ''), v_me_phone),
        true,
        true,
        false,
        'festaai_whatsapp',
        'inbound_platform_whatsapp_me',
        90
      )
      on conflict (company_id, normalized_value) do update
        set
          is_whatsapp = true,
          likely_whatsapp = true,
          last_seen_at = now(),
          updated_at = now();
    end if;
  else
    -- Garante variantes do telefone no cadastro do cliente encontrado
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

    if v_me_phone is distinct from p_canonical_phone then
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
        coalesce(nullif(btrim(p_display_phone), ''), v_me_phone),
        v_me_phone,
        coalesce(nullif(btrim(p_display_phone), ''), v_me_phone),
        true,
        true,
        false,
        'festaai_whatsapp',
        'inbound_platform_whatsapp_match_me',
        80
      )
      on conflict (company_id, normalized_value) do update
        set
          is_whatsapp = true,
          likely_whatsapp = true,
          last_seen_at = now(),
          updated_at = now();
    end if;
  end if;

  -- Garante linha no CRM (trigger já cria em new_lead para inserts novos)
  insert into radar.company_crm (company_id, status, priority, last_contact_at)
  values (v_company_id, 'contact_started', 'medium', now())
  on conflict (company_id) do nothing;

  select status into v_previous_status
  from radar.company_crm
  where company_id = v_company_id
  for update;

  if v_previous_status in ('new_lead', 'qualifying') then
    update radar.company_crm
    set
      status = 'contact_started',
      last_contact_at = now(),
      updated_at = now()
    where company_id = v_company_id;

    v_moved := v_previous_status is distinct from 'contact_started';
  else
    update radar.company_crm
    set
      last_contact_at = now(),
      updated_at = now()
    where company_id = v_company_id;
  end if;

  if v_created or v_moved then
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
      case
        when v_created then 'Contato iniciado via WhatsApp FestaAI (inbound).'
        else 'Movido para Contato iniciado após inbound no WhatsApp FestaAI.'
      end,
      'inbound'
    );
  end if;

  select * into v_crm from radar.company_crm where company_id = v_company_id;

  return jsonb_build_object(
    'ok', true,
    'created', v_created,
    'moved', v_moved,
    'companyId', v_company_id,
    'crmStatus', v_crm.status,
    'previousStatus', v_previous_status
  );
end;
$$;

revoke all on function public.radar_crm_ensure_lead_from_whatsapp(text[], text, text, text)
  from public, anon, authenticated;
grant execute on function public.radar_crm_ensure_lead_from_whatsapp(text[], text, text, text)
  to service_role;

revoke all on function radar.phone_digit_variants(text) from public, anon, authenticated;
grant execute on function radar.phone_digit_variants(text) to service_role;
