# FestaAI

SaaS para casas de festas infantis gerenciarem a jornada completa de cada evento: primeiro contato, proposta, negociacao, fechamento, planejamento, contrato, organizacao, execucao, pos-venda e oportunidade futura.

O projeto nasceu como prototipo de UI no Lovable e esta sendo evoluido para um produto real com Vite, React, TypeScript, Supabase, Asaas, Brevo e deploy futuro na Netlify.

## Stack

- Vite + React + TypeScript
- Tailwind CSS
- Shadcn UI + Radix UI
- React Router
- TanStack Query
- Supabase para Auth, banco, RLS e Edge Functions
- Asaas para assinaturas
- Brevo para e-mails transacionais
- Netlify para deploy do frontend

## Requisitos Locais

- Node.js compativel com o projeto
- pnpm `10.24.0`

Use exclusivamente `pnpm`. Nao use `npm` ou `yarn` neste projeto.

## Scripts

```bash
pnpm dev
pnpm build
pnpm build:dev
pnpm lint
pnpm test
pnpm test:watch
pnpm preview
```

## Desenvolvimento

O servidor local deve rodar na porta `3000`.

```bash
pnpm dev
```

Acesse:

```text
http://localhost:3000
```

## Documentacao

- PRD: `docs/prd.md`
- Plano de implementacao: `docs/implementation-plan.md`

## Variaveis de Ambiente

As variaveis publicas do frontend devem usar o prefixo `VITE_`.

Chaves secretas, como service role do Supabase, Asaas, Brevo e Stripe futuro, nunca devem ser expostas no frontend. Esses segredos devem ficar em ambientes seguros, especialmente Supabase Edge Functions.

## Principios do Produto

- `eventos` e a entidade central do sistema.
- O sistema deve ser multi-tenant desde o inicio.
- Toda tabela de negocio deve usar `tenant_id`.
- RLS deve proteger todas as tabelas sensiveis.
- A UI existente deve ser reaproveitada ao maximo.
- Follow-ups serao tratados externamente via n8n.
