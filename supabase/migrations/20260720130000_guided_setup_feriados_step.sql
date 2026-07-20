-- Etapa de configuração guiada: Feriados.

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
      'feriados',
      'checklist',
      'contrato',
      'formulario',
      'followup_proposta',
      'pesquisa_avaliacao',
      'whatsapp',
      'automacoes',
      'completed'
    )
  );

-- Tenants que já concluíram a configuração não precisam refazer esta etapa.
update public.tenant_guided_setup_progress
set
  completed_steps = array_append(completed_steps, 'feriados')
where current_step = 'completed'
  and not ('feriados' = any (completed_steps));
