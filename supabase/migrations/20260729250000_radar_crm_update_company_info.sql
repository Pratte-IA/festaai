-- Permite editar dados cadastrais/contato do lead no CRM (platform admin).

create or replace function public.radar_crm_update_company_info(
  p_company_id bigint,
  p_name text default null,
  p_trade_name text default null,
  p_legal_name text default null,
  p_category text default null,
  p_phone text default null,
  p_whatsapp text default null,
  p_email text default null,
  p_city text default null,
  p_state text default null,
  p_address text default null,
  p_website text default null,
  p_instagram_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, radar
as $$
declare
  v_row radar.market_companies%rowtype;
  v_phone text;
  v_whatsapp text;
  v_digits text;
  v_name text;
begin
  if not public.is_platform_admin() then
    raise exception 'Acesso negado: apenas administradores da plataforma.';
  end if;

  if not exists (select 1 from radar.market_companies where id = p_company_id) then
    raise exception 'Empresa não encontrada.';
  end if;

  if p_name is not null and nullif(btrim(p_name), '') is null then
    raise exception 'O nome da empresa é obrigatório.';
  end if;

  v_name := nullif(btrim(coalesce(p_name, '')), '');
  v_phone := nullif(btrim(coalesce(p_phone, '')), '');
  v_whatsapp := nullif(btrim(coalesce(p_whatsapp, '')), '');
  v_digits := nullif(regexp_replace(coalesce(v_whatsapp, v_phone, ''), '\D', '', 'g'), '');

  update radar.market_companies
  set
    name = case
      when p_name is not null then v_name
      else name
    end,
    trade_name = case
      when p_trade_name is not null then nullif(btrim(p_trade_name), '')
      else trade_name
    end,
    legal_name = case
      when p_legal_name is not null then nullif(btrim(p_legal_name), '')
      else legal_name
    end,
    category = case
      when p_category is not null then nullif(btrim(p_category), '')
      else category
    end,
    phone = case
      when p_phone is not null then v_phone
      else phone
    end,
    phone_unformatted = case
      when p_phone is not null or p_whatsapp is not null then v_digits
      else phone_unformatted
    end,
    whatsapp = case
      when p_whatsapp is not null then v_whatsapp
      else whatsapp
    end,
    email = case
      when p_email is not null then nullif(btrim(p_email), '')
      else email
    end,
    city = case
      when p_city is not null then nullif(btrim(p_city), '')
      else city
    end,
    state = case
      when p_state is not null then nullif(btrim(p_state), '')
      else state
    end,
    address = case
      when p_address is not null then nullif(btrim(p_address), '')
      else address
    end,
    website = case
      when p_website is not null then nullif(btrim(p_website), '')
      else website
    end,
    instagram_url = case
      when p_instagram_url is not null then nullif(btrim(p_instagram_url), '')
      else instagram_url
    end,
    updated_at = now()
  where id = p_company_id
  returning * into v_row;

  return to_jsonb(v_row)
    - 'cnpj_raw_data'
    - 'cnpj_candidate_data'
    - 'cnpj_validation_data'
    - 'cnpj_validation_reasons'
    - 'instagram_profiles';
end;
$$;

revoke all on function public.radar_crm_update_company_info(
  bigint, text, text, text, text, text, text, text, text, text, text, text, text
) from public, anon;
grant execute on function public.radar_crm_update_company_info(
  bigint, text, text, text, text, text, text, text, text, text, text, text, text
) to authenticated;
