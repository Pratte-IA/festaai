-- Limpa restos de tentativa parcial da migration de pesquisa de satisfação.
drop table if exists public.evento_satisfaction_responses cascade;
drop table if exists public.tenant_satisfaction_survey_questions cascade;

drop trigger if exists seed_satisfaction_survey_on_tenant_create on public.tenants;
drop function if exists public.seed_satisfaction_survey_on_tenant_create();
drop function if exists public.seed_tenant_satisfaction_survey_questions(bigint);
