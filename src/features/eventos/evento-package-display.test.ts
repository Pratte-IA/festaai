import { describe, expect, it } from "vitest";

import { getEventoPackageDisplay } from "./evento-package-display";

const catalog = [
  { id: "1", name: "Pacote Ouro" },
  { id: "2", name: "Pacote Prata" },
];

describe("getEventoPackageDisplay", () => {
  it("marca pacote como legado quando o nome nao existe no catalogo atual", () => {
    const result = getEventoPackageDisplay(
      { pacote_id: null, pacote_nome: "Pacote Antigo 2019" },
      catalog,
    );

    expect(result.label).toBe("Pacote Antigo 2019");
    expect(result.isLegacy).toBe(true);
  });

  it("preserva nome legado quando o pacote_id aponta para registro inexistente", () => {
    const result = getEventoPackageDisplay(
      { pacote_id: 999, pacote_nome: "Festa Completa Antiga" },
      catalog,
    );

    expect(result.label).toBe("Festa Completa Antiga");
    expect(result.isLegacy).toBe(true);
  });

  it("nao marca como legado quando o pacote ainda existe no catalogo", () => {
    const result = getEventoPackageDisplay(
      { pacote_id: 1, pacote_nome: "Pacote Ouro" },
      catalog,
    );

    expect(result.isLegacy).toBe(false);
  });
});
