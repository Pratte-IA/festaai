-- Adiciona etapa de pacotes na configuração guiada

alter table public.tenant_guided_setup_progress
  drop constraint if exists tenant_guided_setup_progress_current_step_check;

alter table public.tenant_guided_setup_progress
  add constraint tenant_guided_setup_progress_current_step_check
  check (current_step in ('company_profile', 'packages', 'completed'));
