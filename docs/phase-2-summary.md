# Fase 2 - Resumo de Entrega

Status: concluida.

## Entregue

- Tabela central `eventos` criada no Supabase remoto com `int8`, `tenant_id`, constraints de funil/etapa/status/tipo, indices e RLS.
- CRM conectado a dados reais via `useEventos`.
- Kanban conectado a `eventos`, com drag and drop persistido via `useUpdateEventoStage`.
- Detalhe do evento conectado a `useEvento`.
- Tabelas operacionais `evento_pagamentos`, `evento_tarefas` e `evento_notas` criadas com `int8`, `tenant_id`, FK composta para evitar vinculo cross-tenant, indices, triggers `updated_at` e RLS.
- Hooks React Query adicionados para:
  - criar evento;
  - editar evento;
  - listar/criar pagamentos;
  - listar/criar/alternar tarefas;
  - listar/criar notas.
- `EventoDetalhe` passou a persistir pagamentos, tarefas e notas.
- `EventoFormDialog` criado para criacao e edicao de eventos com validacao zod.
- Validacao frontend e backend garantem que a etapa pertence ao funil selecionado.

## Validacoes

- `pnpm typecheck`: passou.
- `pnpm lint`: passou com 7 warnings ja conhecidos de Fast Refresh em componentes Shadcn.
- `pnpm build`: passou.

## Observacoes

- As acoes rapidas "Marcar como Vendido", "Marcar como Perdido", "Mover para outro funil" e "Excluir lead" seguem visuais por enquanto. Elas devem virar mutations dedicadas em uma etapa posterior, com regras de UX e seguranca especificas.
- `EventChecklist` ainda usa configuracao local; a persistencia de configuracoes por tenant esta prevista na Fase 4.
- O build emite aviso de chunk acima de 500 kB. Isso nao bloqueia a fase, mas deve ser tratado com code splitting antes do lancamento.
