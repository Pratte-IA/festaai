import { describe, expect, it } from "vitest";

import type { Evento } from "@/features/eventos";

import {
  getReceivableDueDate,
  isReceivableOverdue,
  shouldShowInReceivablesCard,
} from "./receivable-due-window";

const baseEvent = (overrides: Partial<Evento>): Evento =>
  ({
    checklist_concluidos: [],
    cliente_nome: "Cliente",
    created_at: "2026-07-01T10:00:00.000Z",
    data_evento: "2026-07-18",
    data_limite_pagamento: null,
    etapa: "planejamento",
    forma_pagamento_saldo: "7 dias antes da festa",
    funil: "festa",
    id: 1,
    status_interno: "ativo",
    tipo_evento: "festa",
    updated_at: "2026-07-01T10:00:00.000Z",
    valor_entrada: 0,
    valor_total: 2000,
    ...overrides,
  }) as Evento;

describe("receivable-due-window", () => {
  const weekStart = "2026-07-07";
  const weekEnd = "2026-07-13";
  const today = "2026-07-09";

  it("usa data_limite_pagamento quando informada", () => {
    expect(getReceivableDueDate(baseEvent({ data_limite_pagamento: "2026-07-12" }))).toBe("2026-07-12");
  });

  it("calcula vencimento 7 dias antes da festa", () => {
    expect(getReceivableDueDate(baseEvent())).toBe("2026-07-11");
  });

  it("inclui saldo com vencimento na semana corrente", () => {
    expect(shouldShowInReceivablesCard(baseEvent(), weekStart, weekEnd, today)).toBe(true);
    expect(
      shouldShowInReceivablesCard(baseEvent({ data_limite_pagamento: "2026-07-12" }), weekStart, weekEnd, today),
    ).toBe(true);
  });

  it("inclui saldos em atraso de semanas anteriores", () => {
    expect(
      shouldShowInReceivablesCard(
        baseEvent({ data_limite_pagamento: "2026-06-30" }),
        weekStart,
        weekEnd,
        today,
      ),
    ).toBe(true);
    expect(isReceivableOverdue(baseEvent({ data_limite_pagamento: "2026-06-30" }), today)).toBe(true);
  });

  it("exclui vencimentos futuros fora da semana", () => {
    expect(
      shouldShowInReceivablesCard(
        baseEvent({ data_limite_pagamento: "2026-07-20" }),
        weekStart,
        weekEnd,
        today,
      ),
    ).toBe(false);
  });
});
