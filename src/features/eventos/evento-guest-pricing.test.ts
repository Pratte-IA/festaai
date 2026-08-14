import { describe, expect, it } from "vitest";

import {
  appendConvidadosAlteracaoHistorico,
  parseConvidadosAlteracoesHistorico,
  recalculateEventoGuestPricing,
} from "./evento-guest-pricing";
import { Evento } from "./types";

describe("evento-guest-pricing", () => {
  it("recalcula valor do pacote conforme faixa de convidados", () => {
    const packages = [
      {
        id: "1",
        name: "Pacote Ouro",
        pricingSchedule: {
          bands: [
            {
              id: "default",
              label: "Padrão",
              days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
              includesHolidays: true,
            },
          ],
        },
        pricingTiers: [
          {
            id: "tier-1",
            minGuests: 1,
            maxGuests: 90,
            bandPrices: { default: 3000 },
          },
          {
            id: "tier-2",
            minGuests: 91,
            maxGuests: 120,
            bandPrices: { default: 3500 },
          },
        ],
      },
    ] as Parameters<typeof recalculateEventoGuestPricing>[0]["packages"];

    const interpolated = recalculateEventoGuestPricing({
      dataEvento: "2026-08-15",
      guestCount: 100,
      pacoteId: 1,
      packages,
      valorAdicionais: 500,
      valorPacote: 3000,
    });

    expect(interpolated.valor_pacote).toBe(3333.33);
    expect(interpolated.valor_total).toBe(3833.33);

    const exactNextTier = recalculateEventoGuestPricing({
      dataEvento: "2026-08-15",
      guestCount: 120,
      pacoteId: 1,
      packages,
      valorAdicionais: 500,
      valorPacote: 3000,
    });

    expect(exactNextTier.valor_pacote).toBe(3500);
    expect(exactNextTier.valor_total).toBe(4000);
  });

  it("registra historico quando convidados mudam apos contrato assinado", () => {
    const evento = {
      convidados_alteracoes_historico: [],
      quantidade_convidados: 90,
      valor_pacote: 3000,
      valor_total: 3500,
    } as Pick<
      Evento,
      "convidados_alteracoes_historico" | "quantidade_convidados" | "valor_pacote" | "valor_total"
    >;

    const history = appendConvidadosAlteracaoHistorico(
      evento,
      {
        quantidade_convidados: 100,
        valor_pacote: 3500,
        valor_total: 4000,
      },
      { trackHistory: true },
    );

    expect(history).toHaveLength(1);
    expect(history?.[0]).toMatchObject({
      previous_guest_count: 90,
      new_guest_count: 100,
      previous_valor_total: 3500,
      new_valor_total: 4000,
    });
  });

  it("ignora historico invalido no parse", () => {
    expect(parseConvidadosAlteracoesHistorico([{ altered_at: "2026-07-07" }])).toEqual([]);
  });

  it("aplica faixa e banda corretas para Pacote Carrossel", () => {
    const carrossel = {
      id: "5",
      name: "Pacote Carrossel",
      includedGuests: 120,
      pricingSchedule: {
        presetId: "seg_sex_fds_feriado",
        holidayPolicy: "weekend_band",
        bands: [
          {
            id: "band-weekdays",
            label: "Segunda a sexta",
            days: [1, 2, 3, 4, 5],
            includesHolidays: false,
          },
          {
            id: "band-weekend",
            label: "Sáb, dom e feriados",
            days: [6, 0],
            includesHolidays: true,
          },
        ],
      },
      pricingTiers: [
        {
          id: "tier-50",
          minGuests: 41,
          maxGuests: 50,
          bandPrices: { "band-weekdays": 5279, "band-weekend": 5779 },
        },
      ],
    } as Parameters<typeof recalculateEventoGuestPricing>[0]["packages"][number];

    const weekday = recalculateEventoGuestPricing({
      guestCount: 50,
      pacoteId: 5,
      packages: [carrossel],
      valorAdicionais: 0,
      valorPacote: 0,
    });

    const weekend = recalculateEventoGuestPricing({
      dataEvento: "2026-07-18",
      guestCount: 50,
      pacoteId: 5,
      packages: [carrossel],
      valorAdicionais: 0,
      valorPacote: 0,
    });

    expect(weekday.valor_pacote).toBe(5279);
    expect(weekend.valor_pacote).toBe(5779);
  });
});
