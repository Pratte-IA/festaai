import { describe, expect, it } from "vitest";

import { getEventoDataEntradaInstant, getEventoDataEntradaIso } from "./get-evento-data-entrada";

describe("getEventoDataEntradaIso", () => {
  it("prefere data_primeiro_contato", () => {
    expect(
      getEventoDataEntradaIso({
        data_primeiro_contato: "2026-05-26",
        created_at: "2026-06-17T10:00:00.000Z",
      }),
    ).toBe("2026-05-26");
  });

  it("usa created_at quando data_primeiro_contato é null", () => {
    expect(
      getEventoDataEntradaIso({
        data_primeiro_contato: null,
        created_at: "2026-06-17T10:00:00.000Z",
      }),
    ).toBe("2026-06-17");
  });
});

describe("getEventoDataEntradaInstant", () => {
  it("usa meio-dia local para date-only", () => {
    expect(
      getEventoDataEntradaInstant({
        data_primeiro_contato: "2026-05-26",
        created_at: "2026-06-17T10:00:00.000Z",
      }),
    ).toBe("2026-05-26T12:00:00");
  });
});
