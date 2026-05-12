# Resumo da Fase 8 - Seguranca, Qualidade e Performance

## Status

Concluida.

## Entregue

- Advisors do Supabase consultados para seguranca e performance.
- Migration `20260511143000_security_performance_hardening.sql` criada e aplicada.
- Migration `20260511144500_restrict_public_function_execution.sql` criada e aplicada.
- `search_path` fixado em funcoes publicas auditadas.
- Execucao anonima de funcoes `SECURITY DEFINER` revogada.
- `handle_new_user_profile` deixou de ser executavel por `anon` e `authenticated`.
- `is_tenant_member` e `has_tenant_role` continuam executaveis por `authenticated` porque sao usadas pelas policies RLS.
- Policies de `profiles` recriadas usando `(select auth.uid())`.
- `billing_webhook_events` recebeu policy explicita sem acesso para clientes.
- Indices adicionados para foreign keys apontadas pelo advisor de performance.
- Teste SQL `supabase/tests/rls_isolation.sql` criado para validar isolamento cross-tenant.
- Teste RLS executado no Supabase `FestaAI` com transacao e rollback.
- Helper `canAccessTenantApp` criado em `src/features/tenants/access-policy.ts`.
- `ProtectedRoute` agora bloqueia tenants `suspended` e `canceled`.
- Testes unitarios adicionados:
  - `src/features/eventos/stage-validation.test.ts`;
  - `src/features/tenants/access-policy.test.ts`.
- Rotas migradas para `React.lazy` e `Suspense`.
- `vite.config.ts` atualizado com `manualChunks` para separar vendor chunks.

## Validacoes

- `pnpm test`: passou com 3 arquivos e 5 testes.
- `pnpm typecheck`: passou.
- `pnpm typecheck:node`: passou.
- `pnpm lint`: passou, mantendo apenas os 7 warnings antigos de Fast Refresh dos componentes Shadcn.
- `pnpm build`: passou sem warning de chunk acima de 500 kB.
- `ReadLints` nos arquivos alterados: sem erros.

## Resultado dos Advisors

- Resolvido: warning de `billing_webhook_events` com RLS sem policy.
- Resolvido: warnings de `function_search_path_mutable`.
- Resolvido: warnings de `auth_rls_initplan` em `profiles`.
- Resolvido: execucao anonima das funcoes `SECURITY DEFINER` do tenant.
- Parcialmente pendente: `is_tenant_member` e `has_tenant_role` ainda aparecem para `authenticated`, pois precisam ser chamadas pelas policies. Uma alternativa futura e mover essas helpers para schema privado e atualizar todas as policies.
- Pendente por configuracao do projeto Supabase: habilitar leaked password protection e MFA.
- Pendente por decisao de infraestrutura: extensao `vector` ainda esta no schema `public`.
- Performance: os avisos restantes sao principalmente indices ainda nao usados em ambiente com pouco volume de consultas; nao removi indices de lookup porque eles sao esperados para uso em producao.

## Observacoes

- O bloqueio de tenants `suspended` e `canceled` foi aplicado no frontend como camada de UX. O enforcement definitivo para operacoes sensiveis deve continuar vindo de RLS e Edge Functions.
- `past_due` continua acessivel para evitar bloqueio brusco de operacao; a regra pode ser endurecida depois conforme a politica comercial.
