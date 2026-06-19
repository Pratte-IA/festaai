-- Corrige progresso inflado pelo backfill quando a etapa 1 não foi realmente concluída

update public.tenant_guided_setup_progress p
set
  completed_at = null,
  current_step = 'company_profile',
  completed_steps = '{}'::text[],
  updated_at = now()
where p.completed_at is not null
  and not exists (
    select 1
    from public.tenant_company_profiles cp
    where cp.tenant_id = p.tenant_id
      and cp.completed_at is not null
  );
