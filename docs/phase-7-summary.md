# Resumo da Fase 7 - E-mails Transacionais com Brevo

## Status

Concluida.

## Entregue

- Variaveis Brevo adicionadas ao `.env.local` para preenchimento posterior:
  - `BREVO_API_KEY`;
  - `BREVO_SENDER_EMAIL`;
  - `BREVO_SENDER_NAME`;
  - `BREVO_REPLY_TO_EMAIL`.
- Migration `20260511130000_create_email_events.sql` criada e aplicada no projeto Supabase `FestaAI`.
- Tabela `email_events` criada para registrar logs de envio transacional.
- RLS ativado em `email_events`, com leitura restrita aos membros do tenant.
- Tipos Supabase atualizados em `src/lib/supabase/database.types.ts`.
- Edge Function `send-transactional-email` criada e publicada.
- Templates transacionais iniciais implementados:
  - `welcome`;
  - `invite_member`;
  - `billing_checkout_started`;
  - `billing_payment_confirmed`;
  - `billing_payment_overdue`.
- Integrações de billing atualizadas:
  - `create-asaas-checkout` chama `send-transactional-email` para registrar/enviar e-mail de contratacao iniciada;
  - `asaas-webhook` chama `send-transactional-email` para pagamentos confirmados ou em atraso.
- Feature `src/features/emails` criada com hook `useEmailEvents`.
- Pagina `/minha-assinatura` atualizada com bloco de logs de e-mails transacionais.

## Validacoes

- `pnpm typecheck`: passou.
- `pnpm lint`: passou, mantendo apenas os 7 warnings antigos de Fast Refresh nos componentes Shadcn.
- `pnpm build`: passou, mantendo o warning conhecido de chunk acima de 500 kB.
- `ReadLints` nos arquivos alterados de frontend: sem erros.

## Observacoes

- A funcao `send-transactional-email` registra o evento como `skipped` quando `BREVO_API_KEY` ou `BREVO_SENDER_EMAIL` ainda nao foram configurados. Isso permite testar o fluxo sem quebrar checkout/webhook antes de preencher os segredos.
- A chave Brevo nao e exposta no frontend. O envio acontece exclusivamente em Edge Function.
- Follow-ups comerciais continuam fora do FestaAI, conforme regra do produto. Esta fase cobre apenas e-mails transacionais.
- Os fluxos `onboard-tenant` e `invite-member` ainda nao existem como Edge Functions completas neste projeto; os templates e a funcao central ja estao prontos para serem chamados quando esses fluxos forem implementados.
