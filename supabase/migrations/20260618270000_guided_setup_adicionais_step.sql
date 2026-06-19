-- Etapa de adicionais na configuração guiada (entre pacotes e estrutura)

alter table public.tenant_guided_setup_progress
  drop constraint if exists tenant_guided_setup_progress_current_step_check;

alter table public.tenant_guided_setup_progress
  add constraint tenant_guided_setup_progress_current_step_check
  check (
    current_step in (
      'company_profile',
      'packages',
      'adicionais',
      'estrutura',
      'financeiro',
      'contrato',
      'checklist',
      'whatsapp',
      'completed'
    )
  );

update public.tenant_guided_setup_progress
set
  completed_steps = array[
    'company_profile',
    'packages',
    'adicionais',
    'estrutura',
    'financeiro',
    'contrato',
    'checklist',
    'whatsapp'
  ]::text[]
where completed_at is not null;
