import { describe, expect, it } from "vitest";

import {
  CONTRACT_SIGNATURE_FOLLOWUP_INICIAL_AGUARDANDO_BADGE_HOURS,
  CONTRACT_SIGNATURE_FOLLOWUP_INICIAL_DELAY_HOURS,
  CONTRACT_SIGNATURE_FOLLOWUP_LEMBRETE_DELAY_HOURS,
  getContractSignatureFollowupKanbanBadge,
} from "./contract-signature-followup";

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

describe("getContractSignatureFollowupKanbanBadge", () => {
  it("ignora etapas fora de negociacao", () => {
    expect(
      getContractSignatureFollowupKanbanBadge({
        contract_signature_followup: {
          assinatura_followup_inicial_enviado_em: null,
          assinatura_followup_lembrete_count: 0,
          assinatura_followup_ultimo_enviado_em: null,
          generated_at: hoursAgo(4),
        },
        etapa: "proposta_enviada",
      }),
    ).toBeNull();
  });

  it("mostra aguardando antes do primeiro disparo", () => {
    const badge = getContractSignatureFollowupKanbanBadge({
      contract_signature_followup: {
        assinatura_followup_inicial_enviado_em: null,
        assinatura_followup_lembrete_count: 0,
        assinatura_followup_ultimo_enviado_em: null,
        generated_at: hoursAgo(CONTRACT_SIGNATURE_FOLLOWUP_INICIAL_AGUARDANDO_BADGE_HOURS + 0.5),
      },
      etapa: "negociacao",
    });

    expect(badge?.label).toBe("Aguard. Ass. FU");
  });

  it("mostra confirmacao apos follow-up inicial", () => {
    const badge = getContractSignatureFollowupKanbanBadge({
      contract_signature_followup: {
        assinatura_followup_inicial_enviado_em: hoursAgo(2),
        assinatura_followup_lembrete_count: 0,
        assinatura_followup_ultimo_enviado_em: hoursAgo(2),
        generated_at: hoursAgo(CONTRACT_SIGNATURE_FOLLOWUP_INICIAL_DELAY_HOURS + 1),
      },
      etapa: "negociacao",
    });

    expect(badge?.label).toBe("Ass. FU ✓");
  });

  it("mostra aguardando quando passou o intervalo do lembrete", () => {
    const badge = getContractSignatureFollowupKanbanBadge({
      contract_signature_followup: {
        assinatura_followup_inicial_enviado_em: hoursAgo(
          CONTRACT_SIGNATURE_FOLLOWUP_LEMBRETE_DELAY_HOURS + 1,
        ),
        assinatura_followup_lembrete_count: 1,
        assinatura_followup_ultimo_enviado_em: hoursAgo(
          CONTRACT_SIGNATURE_FOLLOWUP_LEMBRETE_DELAY_HOURS + 0.5,
        ),
        generated_at: hoursAgo(CONTRACT_SIGNATURE_FOLLOWUP_LEMBRETE_DELAY_HOURS + 4),
      },
      etapa: "negociacao",
    });

    expect(badge?.label).toBe("Aguard. Ass. FU");
  });
});
