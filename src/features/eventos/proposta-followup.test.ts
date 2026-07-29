import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getPropostaFollowupKanbanBadge } from "./proposta-followup";

describe("getPropostaFollowupKanbanBadge — Contato Inicial", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-29T15:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("não mostra Aguard. FU0 só com created_at/updated_at (backlog pré-ativação)", () => {
    expect(
      getPropostaFollowupKanbanBadge({
        created_at: "2026-07-10T12:00:00.000Z",
        etapa: "contato_inicial",
        updated_at: "2026-07-10T12:00:00.000Z",
      }),
    ).toBeNull();
  });

  it("mostra Aguard. FU0 quando há marco real parado há +2h", () => {
    expect(
      getPropostaFollowupKanbanBadge({
        contato_inicial_ultima_mensagem_em: "2026-07-29T10:00:00.000Z",
        etapa: "contato_inicial",
      }),
    ).toEqual({ className: "bg-muted text-muted-foreground", label: "Aguard. FU0" });
  });

  it("não mostra badge se o marco tem menos de 2h", () => {
    expect(
      getPropostaFollowupKanbanBadge({
        contato_inicial_ultima_mensagem_em: "2026-07-29T14:00:00.000Z",
        etapa: "contato_inicial",
      }),
    ).toBeNull();
  });

  it("mostra Aguard. FU0b após FU0 com marco ainda ativo", () => {
    expect(
      getPropostaFollowupKanbanBadge({
        contato_inicial_ultima_mensagem_em: "2026-07-29T12:00:00.000Z",
        etapa: "contato_inicial",
        followup_0_enviado_em: "2026-07-29T11:00:00.000Z",
      }),
    ).toEqual({ className: "bg-muted text-muted-foreground", label: "Aguard. FU0b" });
  });
});
