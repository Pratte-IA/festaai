-- Leitura de configuração do tenant pela admin da plataforma (central admin).

create policy "tenant_company_profiles_select_platform_admin"
on public.tenant_company_profiles
for select
to authenticated
using (public.is_platform_admin());

create policy "tenant_guided_setup_progress_select_platform_admin"
on public.tenant_guided_setup_progress
for select
to authenticated
using (public.is_platform_admin());

create policy "tenant_contract_module_settings_select_platform_admin"
on public.tenant_contract_module_settings
for select
to authenticated
using (public.is_platform_admin());

create policy "tenant_contract_module_acceptances_select_platform_admin"
on public.tenant_contract_module_acceptances
for select
to authenticated
using (public.is_platform_admin());

create policy "tenant_contract_templates_select_platform_admin"
on public.tenant_contract_templates
for select
to authenticated
using (public.is_platform_admin());

create policy "tenant_closing_form_fields_select_platform_admin"
on public.tenant_closing_form_fields
for select
to authenticated
using (public.is_platform_admin());

create policy "tenant_satisfaction_survey_questions_select_platform_admin"
on public.tenant_satisfaction_survey_questions
for select
to authenticated
using (public.is_platform_admin());

create policy "tenant_automation_settings_select_platform_admin"
on public.tenant_automation_settings
for select
to authenticated
using (public.is_platform_admin());

create policy "whatsapp_connections_select_platform_admin"
on public.whatsapp_connections
for select
to authenticated
using (public.is_platform_admin());

create policy "tenant_acceptance_terms_select_platform_admin"
on public.tenant_acceptance_terms
for select
to authenticated
using (public.is_platform_admin());
