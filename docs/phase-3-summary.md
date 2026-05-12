# Fase 3 - Resumo de Entrega

Status: concluida.

## Entregue

- Tabela `calendar_blocks` criada no Supabase remoto com `int8`, `tenant_id`, RLS, constraint unica por data e trigger `updated_at`.
- Calendario operacional passou a usar eventos reais da tabela `eventos` e bloqueios persistidos em `calendar_blocks`.
- `MiniCalendar` exibe festas, visitas e bloqueios reais por tenant.
- `DayDetailPanel` exibe eventos reais do dia e permite bloquear/desbloquear datas com persistencia no Supabase.
- Dashboard passou a calcular metricas reais por tenant:
  - leads do periodo;
  - festas fechadas;
  - taxa de conversao;
  - valor vendido;
  - faturamento do mes;
  - valor a receber;
  - saldo pendente;
  - indicadores de pos-venda.
- `PartyList` passou a listar proximas festas reais.
- `AlertItem` passou a representar prioridades reais derivadas dos eventos.

## Validacoes

- `pnpm typecheck`: passou.
- `pnpm lint`: passou com 7 warnings ja conhecidos de Fast Refresh em componentes Shadcn.
- `pnpm build`: passou.

## Observacoes

- As metricas do dashboard foram calculadas no client usando React Query e RLS. Para volume maior, a recomendacao e mover agregacoes para views/RPCs SQL na fase de performance.
- O build segue emitindo aviso de chunk acima de 500 kB. Recomenda-se code splitting antes do Go-Live.
- Os mocks remanescentes encontrados estao em componentes de relatorios, previstos para a Fase 5.
