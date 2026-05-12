# Resumo da Fase 6 - Assinaturas com Asaas e Billing

## Status

Concluida.

## Entregue

- Migration `20260511122000_create_billing_tables.sql` criada e aplicada no projeto Supabase `FestaAI`.
- Tabelas criadas:
  - `subscription_plans`;
  - `billing_customers`;
  - `billing_subscriptions`;
  - `billing_webhook_events`.
- RLS ativado nas tabelas de billing:
  - planos ativos podem ser lidos publicamente para a pagina `/contratar`;
  - customers e subscriptions sao visiveis apenas para membros do tenant;
  - webhooks ficam sem policies publicas e sao manipulados por Edge Functions com service role.
- Planos iniciais cadastrados:
  - Starter;
  - Profissional;
  - Enterprise.
- Feature frontend `src/features/billing` criada com:
  - query keys;
  - tipos;
  - `useSubscriptionPlans`;
  - `useCreateCheckout`;
  - `useBillingSubscription`.
- Pagina `/contratar` migrada de dados estaticos para `subscription_plans`.
- Fluxo de contratacao conectado a Edge Function `create-asaas-checkout`.
- Pagina protegida `/minha-assinatura` criada para exibir status de assinatura do tenant.
- Sidebar atualizada com item `Assinatura`.
- Edge Functions criadas e publicadas:
  - `create-asaas-checkout`;
  - `asaas-webhook`;
  - `cancel-subscription`;
  - `billing-provider-router`.
- Webhook Asaas implementado com token proprio e idempotencia por `billing_webhook_events`.
- Estrutura de provider mantida por coluna `provider`, permitindo evoluir para Stripe sem reescrever a UI.

## Validacoes

- `pnpm typecheck`: passou.
- `pnpm lint`: passou, mantendo apenas os 7 warnings antigos de Fast Refresh nos componentes Shadcn.
- `pnpm build`: passou, mantendo o warning conhecido de chunk acima de 500 kB.
- `ReadLints` nos arquivos alterados de frontend: sem erros.

## Variaveis Necessarias nas Edge Functions

- `ASAAS_API_KEY`: chave privada do Asaas.
- `ASAAS_API_URL`: URL da API Asaas. Se omitida, a funcao usa `https://sandbox.asaas.com/api/v3`.
- `ASAAS_WEBHOOK_TOKEN`: token compartilhado configurado no webhook do Asaas.
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`: variaveis server-side usadas pelas Edge Functions.

## Observacoes

- A criacao de checkout ja persiste customer e assinatura localmente, mas o vinculo `tenant_id` pode ficar nulo quando a contratacao acontece antes do onboarding/logon. A fase de onboarding deve associar essa assinatura ao tenant definitivo quando a conta for criada.
- A funcao `create-asaas-checkout` esta publica porque a pagina `/contratar` e publica; o payload e validado com Zod, mas ainda e recomendavel adicionar rate limiting antes do Go-Live.
- O webhook atualiza `billing_subscriptions.status`; regras mais duras de bloqueio de acesso para tenants `past_due` e `canceled` devem ser refinadas na fase de seguranca/Go-Live.
