# Fase 1 - Resumo e Checklist

## Status

Fase 1 concluida como fundacao inicial de Auth, Supabase e multi-tenancy.

O objetivo desta fase foi sair de um frontend aberto com mocks para uma base autenticada, conectada ao Supabase, com isolamento inicial por tenant e RLS nas novas tabelas centrais.

## Itens Concluidos

- `@supabase/supabase-js` instalado com `pnpm`.
- Cliente Supabase criado em `src/lib/supabase/client.ts`.
- Tipos gerados do Supabase salvos em `src/lib/supabase/database.types.ts`.
- Cliente Supabase tipado com `createClient<Database>()`.
- Camada de Auth criada em `src/features/auth`.
- `AuthProvider` integrado em `src/App.tsx`.
- Hook global `useAuth` criado.
- Hook `useAuthSession` criado com:
  - `getSession`.
  - `onAuthStateChange`.
  - `refreshSession`.
  - `signOut`.
- Tela de login criada em `src/pages/Login.tsx`.
- Rota `/login` adicionada.
- Rotas internas protegidas com `ProtectedRoute`.
- Rota `/contratar` mantida publica.
- Logout adicionado na `AppSidebar`.
- E-mail do usuario autenticado exibido na sidebar.
- Migration Supabase criada em `supabase/migrations/20260506203000_create_auth_tenant_foundation.sql`.
- Migration aplicada no projeto Supabase remoto.
- Migration corretiva criada e aplicada em `supabase/migrations/20260507004500_recreate_tenant_foundation_with_int8_ids.sql`.
- Tabelas criadas:
  - `profiles`.
  - `tenants`.
  - `tenant_members`.
- Padrao de IDs ajustado:
  - `profiles.id` permanece `uuid`, pois referencia `auth.users(id)` do Supabase Auth.
  - `tenants.id` usa `int8`.
  - `tenant_members.id` usa `int8`.
  - `tenant_members.tenant_id` usa `int8`.
- RLS habilitado nas novas tabelas.
- Policies criadas para acesso por membership e roles.
- Funcoes SQL criadas:
  - `public.is_tenant_member`.
  - `public.has_tenant_role`.
- Trigger criado para gerar `profile` ao criar usuario Auth.
- Usuario de teste criado e validado.
- Tenant de teste criado e vinculado ao usuario de teste como `owner`.
- Camada frontend de tenants criada em `src/features/tenants`.
- `TenantProvider` integrado no app.
- `useTenants` e `useCurrentTenant` criados.
- Tenant ativo exibido na sidebar.
- `ProtectedRoute` endurecido para exigir tenant ativo nas rotas internas.

## Usuario de Teste

```text
E-mail: teste@festaai.com.br
Senha: FestaAI@2026
Tenant: FestaAI Teste
Role: owner
```

## Validacoes Executadas

```bash
pnpm typecheck
pnpm lint
pnpm build
```

Resultado:

- `pnpm typecheck`: aprovado.
- `pnpm lint`: aprovado com 7 warnings conhecidos de Fast Refresh em componentes Shadcn.
- `pnpm build`: aprovado.

Tambem foi validado:

- Login via Supabase com o usuario de teste.
- Leitura de `tenants` via anon key + sessao autenticada.
- `tenants.id` validado como `number` no frontend, refletindo `int8` no banco.
- RLS retornando somente o tenant vinculado ao usuario de teste.
- Policies existentes em `profiles`, `tenants` e `tenant_members`.

## Warnings Conhecidos

- O lint ainda reporta 7 warnings de Fast Refresh em componentes Shadcn.
- O bundle principal ficou acima de 500 kB apos adicionar Supabase/Auth. Isso sera tratado na fase de performance com lazy loading e code splitting.

## Pendencias Deliberadas

- Fluxo de cadastro publico ainda nao foi implementado.
- Recuperacao de senha ainda nao foi implementada.
- Convite de membros ainda nao foi implementado.
- Edge Functions `onboard-tenant`, `invite-member` e `send-transactional-email` ainda nao foram criadas.
- Seletor visual de tenant para multiempresa ainda nao foi criado; hoje o primeiro tenant disponivel e selecionado automaticamente.
- Supabase local/CLI ainda nao foi configurado; a migration foi versionada no repositorio e aplicada via MCP remoto.

## Pendencias de Seguranca

O Supabase MCP apontou tabelas legadas com RLS desabilitado:

- `public.NOVO_LEAD`.
- `public.n8n_chat_histories`.
- `public.documents`.

Essas tabelas nao foram alteradas porque parecem ser legadas ou usadas por integracoes externas. A correcao deve ser planejada separadamente para nao quebrar fluxos existentes.

SQL de remediacao futura, caso aprovado:

```sql
ALTER TABLE public.NOVO_LEAD ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.n8n_chat_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
```

Antes de aplicar, sera necessario definir policies adequadas para cada caso.

## Checklist de Saida da Fase 1

- [x] Cliente Supabase configurado.
- [x] Auth global implementado.
- [x] Login implementado.
- [x] Logout implementado.
- [x] Rotas internas protegidas.
- [x] Tenant obrigatorio nas rotas internas.
- [x] Tabelas base multi-tenant criadas.
- [x] RLS habilitado nas novas tabelas.
- [x] Policies base criadas.
- [x] Usuario e tenant de teste criados.
- [x] Tipos Supabase gerados e conectados ao client.
- [x] Typecheck/lint/build validados.

## Proximo Passo

Iniciar Fase 2: Modelo Central de Eventos e Persistencia do CRM.

Primeiro item recomendado:

- Criar migration da tabela `eventos` com `tenant_id`, funil, etapa, status, campos do cliente e indices principais.
