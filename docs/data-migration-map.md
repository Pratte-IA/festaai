# Mapa de Migracao dos Dados Mockados

Este documento registra onde os dados de `src/data/*` sao usados hoje e qual deve ser o destino durante a migracao para Supabase, React Query e arquitetura multi-tenant.

## Objetivo

Substituir gradualmente dados estaticos e mutacoes em memoria por queries, mutations e Edge Functions seguras, preservando a UI criada no Lovable.

## Fontes Atuais em `src/data`

| Arquivo | Papel atual | Destino recomendado |
| --- | --- | --- |
| `src/data/mockEvents.ts` | Eventos, funis, etapas, pagamentos e tipos base do CRM | `src/features/eventos`, tabelas `eventos`, `evento_pagamentos`, `evento_tarefas`, `evento_notas` |
| `src/data/calendarAvailability.ts` | Disponibilidade do calendario derivada de `mockEvents` e bloqueios em memoria | `src/features/calendario`, tabela `calendar_blocks`, queries de eventos por periodo |
| `src/data/packagesData.ts` | Pacotes, adicionais e faixas de preco padrao | `src/features/configuracoes`, tabelas `pacotes`, `pacote_precos`, `adicionais` |
| `src/data/plansData.ts` | Planos comerciais exibidos na pagina de contratacao e configuracao | `src/features/billing`, tabela `subscription_plans` e Edge Function de checkout Asaas |
| `src/data/checklistConfig.ts` | Templates de checklist e geracao local de checklist por evento | `src/features/configuracoes` e `src/features/eventos`, tabelas `checklist_templates` e `evento_tarefas` |
| `src/data/packageTemplates.ts` | Sugestoes e modelos para acelerar criacao de pacotes | Manter como constantes publicas ou migrar para seed/config global nao sensivel |

## Consumos Atuais por Area

### CRM e Eventos

- `src/pages/CRM.tsx`
  - Usa `mockEvents`, `FunnelType`, `salesStages`, `partyStages`, `executedStages`.
  - Migrar para `useEventos({ funnel })` e constantes de funil em `src/features/eventos`.
- `src/components/KanbanBoard.tsx`
  - Usa tipos `Event` e `Stage`.
  - Migrar para props baseadas em tipos de dominio e mutation `useUpdateEventoStage`.
- `src/pages/EventoDetalhe.tsx`
  - Usa `mockEvents` e `Payment`.
  - Migrar para `useEvento`, `useEventoPagamentos`, `useEventoTarefas` e `useEventoNotas`.

### Dashboard e Calendario

- `src/components/MiniCalendar.tsx`
  - Usa `getMonthDays` e `DayInfo`.
  - Migrar para hook `useCalendarMonth`.
- `src/pages/Calendario.tsx`
  - Usa `getDayInfo` e `DayInfo`.
  - Migrar para `useCalendarDay`.
- `src/components/DayDetailPanel.tsx`
  - Usa `DayInfo`, `formatDateBR`, `addBlockedDate`, `removeBlockedDate`.
  - Migrar bloqueios para mutations `useCreateCalendarBlock` e `useDeleteCalendarBlock`.
- `src/data/calendarAvailability.ts`
  - Usa `mockEvents` e array local `manuallyBlockedDates`.
  - Deve deixar de ser fonte de verdade apos a criacao de `calendar_blocks`.

### Relatorios

- `src/components/FinanceiroReport.tsx`
  - Usa `mockEvents` e `Event`.
  - Migrar para `useFinancialReport`.
- `src/components/OcupacaoReport.tsx`
  - Usa `mockEvents`.
  - Migrar para `useOccupancyReport`.
- `src/components/PosVendaReport.tsx`
  - Usa `mockEvents` e `Event`.
  - Migrar para `usePostSaleReport`.
- `src/components/RecompraReport.tsx`
  - Usa `mockEvents` e `Event`.
  - Migrar para `useFutureOpportunitiesReport`.
- `src/components/LeadsPerdidosReport.tsx`
  - Usa `mockEvents` e `Event`.
  - Migrar para `useLostEventsReport`.

### Configuracoes

- `src/components/PackagesConfig.tsx`
  - Usa `PackageData` e `defaultPackages`.
  - Migrar para `usePackages`, `useCreatePackage`, `useUpdatePackage`, `useDeletePackage`.
- `src/components/AdditionalsConfig.tsx`
  - Usa `Additional` e `defaultAdditionals`.
  - Migrar para `useAdditionals` e mutations de adicionais.
- `src/components/PlansConfig.tsx`
  - Usa `CommercialPlan`, `SetupType`, `defaultPlans`.
  - Separar planos do SaaS de configuracoes operacionais do tenant. Migrar planos de assinatura para `src/features/billing`.
- `src/components/ChecklistConfig.tsx`
  - Usa `ChecklistCategory`, `ChecklistItem`, `defaultChecklistConfig`.
  - Migrar para `useChecklistTemplates`.
- `src/components/EventChecklist.tsx`
  - Usa `defaultChecklistConfig`, `generateEventChecklist`, `EventChecklistCategory`.
  - Migrar para tarefas reais em `evento_tarefas`; templates servem apenas para criacao inicial.
- `src/components/PackageWizard.tsx`
  - Usa tipos de pacotes/adicionais e sugestoes de `packageTemplates`.
  - Manter sugestoes estaticas no curto prazo; persistir o pacote final no Supabase.

### Contratacao

- `src/pages/Contratar.tsx`
  - Usa `defaultPlans` e `CommercialPlan`.
  - Migrar para `usePublicSubscriptionPlans` ou payload publico controlado.
  - A criacao de assinatura deve chamar Edge Function `create-asaas-checkout`.

## Ordem Recomendada de Migracao

1. Extrair tipos e constantes de funil de `src/data/mockEvents.ts` para `src/features/eventos`.
2. Criar tabelas e RLS de `eventos`.
3. Migrar `CRM.tsx` e `KanbanBoard.tsx` para hooks reais.
4. Migrar `EventoDetalhe.tsx` para evento, pagamentos, tarefas e notas reais.
5. Migrar calendario e bloqueios manuais.
6. Migrar configuracoes por tenant.
7. Migrar relatorios para queries agregadas/RPCs.
8. Migrar contratacao para planos publicos e Asaas via Edge Function.

## Cuidados de Seguranca

- Todo dado de negocio precisa de `tenant_id`.
- Hooks do frontend devem depender do tenant ativo.
- RLS deve bloquear acesso cross-tenant mesmo se alguem chamar o Supabase diretamente.
- Dados de billing devem ter escrita sensivel apenas por Edge Functions.
- Nenhuma chave Asaas, Brevo, Stripe ou `service_role` deve ser usada em `src/data`, hooks ou componentes.
