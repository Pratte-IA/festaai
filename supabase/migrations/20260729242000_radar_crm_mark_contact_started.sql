-- Move lead do CRM para "contact_started" quando houver mensagem WhatsApp outbound/inbound.
-- Só altera new_lead e qualifying; demais etapas permanecem.

create or replace function public.radar_crm_mark_contact_started(
  p_company_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public, radar
as $$
declare
  v_previous text;
  v_crm radar.company_crm%rowtype;
begin
  if p_company_id is null then
    raise exception 'company_id obrigatório.';
  end if;

  if not exists (select 1 from radar.market_companies where id = p_company_id) then
    raise exception 'Empresa não encontrada.';
  end if;

  insert into radar.company_crm (company_id, status, priority, last_contact_at)
  values (p_company_id, 'contact_started', 'medium', now())
  on conflict (company_id) do nothing;

  select status into v_previous
  from radar.company_crm
  where company_id = p_company_id
  for update;

  if v_previous in ('new_lead', 'qualifying') then
    update radar.company_crm
    set
      status = 'contact_started',
      last_contact_at = now(),
      updated_at = now()
    where company_id = p_company_id;

    insert into radar.company_crm_interactions (
      company_id,
      interaction_type,
      interaction_at,
      notes,
      outcome
    )
    values (
      p_company_id,
      'whatsapp',
      now(),
      'Movido para Contato iniciado após mensagem no WhatsApp FestaAI.',
      'outbound'
    );
  else
    update radar.company_crm
    set
      last_contact_at = now(),
      updated_at = now()
    where company_id = p_company_id;
  end if;

  select * into v_crm from radar.company_crm where company_id = p_company_id;

  return jsonb_build_object(
    'ok', true,
    'companyId', p_company_id,
    'previousStatus', v_previous,
    'crmStatus', v_crm.status,
    'moved', v_previous in ('new_lead', 'qualifying')
  );
end;
$$;

revoke all on function public.radar_crm_mark_contact_started(bigint)
  from public, anon, authenticated;
grant execute on function public.radar_crm_mark_contact_started(bigint)
  to service_role;
