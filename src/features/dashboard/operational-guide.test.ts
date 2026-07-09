import { describe, expect, it } from "vitest";

import type { Evento } from "@/features/eventos";
import type { TenantTarefaListItem } from "@/features/tarefas/types";

import { buildOperationalGuide, buildOperationalSummaryLines } from "./operational-guide";

const baseEvent = (overrides: Partial<Evento>): Evento =>
  ({
    checklist_concluidos: [],
    cliente_nome: "Cliente Teste",
    created_at: "2026-07-01T10:00:00.000Z",
    data_evento: "2026-07-15",
    etapa: "boas_vindas",
    funil: "festa",
    id: 1,
    status_interno: "ativo",
    tipo_evento: "festa",
    updated_at: "2026-07-01T10:00:00.000Z",
    valor_entrada: 0,
    valor_total: 2000,
    ...overrides,
  }) as Evento;

describe("buildOperationalGuide", () => {
  it("agrupa festas da semana, boas vindas e checklist pendente", () => {
    const events = [
      baseEvent({ id: 1, etapa: "boas_vindas", data_evento: "2026-07-12" }),
      baseEvent({
        id: 2,
        cliente_nome: "Maria",
        etapa: "planejamento",
        checklist_concluidos: [],
        data_evento: "2026-07-20",
      }),
      baseEvent({
        id: 3,
        cliente_nome: "Joao",
        etapa: "planejamento",
        checklist_concluidos: ["item-1"],
        data_evento: "2026-07-25",
      }),
    ];

    const guide = buildOperationalGuide(events, [], []);

    expect(guide.sections.find((section) => section.id === "organize-boas-vindas")?.count).toBe(1);
    expect(guide.sections.find((section) => section.id === "start-checklist")?.count).toBe(1);
    expect(guide.sections.find((section) => section.id === "finalize-checklist")?.count).toBe(1);
    expect(guide.hasActions).toBe(true);
  });

  it("lista tarefas manuais pendentes no card de tarefas", () => {
    const tarefas: TenantTarefaListItem[] = [
      {
        assigned_to: null,
        concluida: false,
        created_at: "2026-07-01T10:00:00.000Z",
        created_by: null,
        data_limite: "2026-07-08",
        evento: {
          aniversariante_nome: "Helena",
          cliente_nome: "Maria",
          data_evento: "2026-07-20",
          id: 1,
        },
        evento_id: 1,
        id: 10,
        ordem: 1,
        responsavelNome: "Ana",
        tenant_id: 1,
        titulo: "Confirmar decoração",
        updated_at: "2026-07-01T10:00:00.000Z",
        updated_by: null,
      },
      {
        assigned_to: null,
        concluida: true,
        created_at: "2026-07-01T10:00:00.000Z",
        created_by: null,
        data_limite: null,
        evento: null,
        evento_id: 2,
        id: 11,
        ordem: 2,
        responsavelNome: "Ana",
        tenant_id: 1,
        titulo: "Tarefa concluída",
        updated_at: "2026-07-01T10:00:00.000Z",
        updated_by: null,
      },
    ];

    const guide = buildOperationalGuide([], [], tarefas);
    const tasksSection = guide.sections.find((section) => section.id === "tasks");

    expect(tasksSection?.count).toBe(1);
    expect(tasksSection?.alwaysShow).toBe(true);
    expect(tasksSection?.taskItems).toHaveLength(1);
    expect(tasksSection?.taskItems?.[0]?.titulo).toBe("Confirmar decoração");
    expect(tasksSection?.listHref).toBe("/tarefas");
  });

  it("monta frase-resumo com festas, recebiveis, organizacao e checklists", () => {
    const lines = buildOperationalSummaryLines({
      organizeCount: 5,
      pendingChecklistsCount: 23,
      receivablesTotal: 105800,
      weekPartiesCount: 2,
    });

    expect(lines[0]).toBe("Esta semana você tem 2 festas para executar.");
    expect(lines[1]).toBe(
      "Também existem R$ 105.800 a receber esta semana, 5 festas para começar a organizar e 23 checklists pendentes.",
    );
  });
});
