# Estrategia Gradual de TypeScript Strict

## Estado Atual

O projeto ainda vem de um prototipo Lovable e esta com TypeScript permissivo:

- `tsconfig.app.json` usa `strict: false`.
- `tsconfig.app.json` usa `noImplicitAny: false`.
- `tsconfig.app.json` usa `noUnusedLocals: false`.
- `tsconfig.app.json` usa `noUnusedParameters: false`.
- `tsconfig.json` tambem mantem configuracoes permissivas, incluindo `strictNullChecks: false`.

Ativar `strict` de uma vez tende a gerar muitas correcoes em arquivos de UI e mocks, misturando refatoracao tecnica com a implementacao da fundacao SaaS. A recomendacao e medir e endurecer por etapas.

## Scripts de Verificacao

Use os scripts abaixo para medir erros de tipo sem emitir arquivos:

```bash
pnpm typecheck
pnpm typecheck:node
```

Esses scripts nao substituem o baseline atual. Antes de avancar fases, continue usando:

```bash
pnpm lint
pnpm test
pnpm build
```

## Ordem Recomendada

1. Manter `strict: false` durante a Fase 0 e inicio da Fase 1 para evitar uma refatoracao ampla antes da fundacao Supabase.
2. Criar tipos de dominio em `src/features/eventos` antes de migrar o CRM.
3. Evitar `any` em todo codigo novo.
4. Usar `unknown` ou tipos explicitos em entradas externas, especialmente Edge Functions e formularios.
5. Ativar `noImplicitAny: true` apos os primeiros hooks reais de Supabase.
6. Ativar `strictNullChecks: true` depois que Auth, tenant atual e estados de loading/erro estiverem modelados.
7. Ativar `strict: true` quando CRM, eventos e configuracoes principais ja estiverem fora de mocks.
8. Avaliar `noUnusedLocals` e `noUnusedParameters` por ultimo, para nao gerar ruido durante migracoes.

## Regras Para Codigo Novo

- Todo codigo novo deve ser TypeScript.
- Preferir interfaces para objetos de dominio e props.
- Nao introduzir `any`.
- Validar entradas externas com zod quando estiverem ligadas a forms, APIs ou Edge Functions.
- Tipos compartilhados devem ficar proximos ao dominio, nao espalhados em componentes.
- Tipos gerados do Supabase devem ser versionados ou documentados quando a CLI for adicionada.

## Criterio Para Ativar Strict

Ativar `strict: true` somente quando:

- `pnpm typecheck` estiver com uma lista pequena e controlada de erros.
- As rotas protegidas e o tenant atual estiverem tipados.
- Os principais mocks de `eventos` tiverem sido substituidos por hooks reais.
- As tabelas Supabase ja tiverem tipos confiaveis.
- O time aceitar uma tarefa dedicada de saneamento de tipos.
