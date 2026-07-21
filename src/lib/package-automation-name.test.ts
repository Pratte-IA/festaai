import { describe, expect, it } from "vitest";

import {
  buildPackageAutomationName,
  ensureUniquePackageAutomationName,
  isValidPackageAutomationName,
  resolvePackageAutomationNameForSave,
  sanitizePackageAutomationNameInput,
} from "./package-automation-name";

describe("buildPackageAutomationName", () => {
  it("remove acentos, prefixo pacote e usa snake_case", () => {
    expect(buildPackageAutomationName("Pacote Básico")).toBe("basico");
    expect(buildPackageAutomationName("Roda Gigante")).toBe("roda_gigante");
    expect(buildPackageAutomationName("Café Colonial")).toBe("cafe_colonial");
  });
});

describe("sanitizePackageAutomationNameInput", () => {
  it("normaliza entrada manual", () => {
    expect(sanitizePackageAutomationNameInput("  Roda-Gigante  ")).toBe("roda_gigante");
  });
});

describe("isValidPackageAutomationName", () => {
  it("valida formato snake_case", () => {
    expect(isValidPackageAutomationName("basico")).toBe(true);
    expect(isValidPackageAutomationName("roda_gigante")).toBe(true);
    expect(isValidPackageAutomationName("Pacote")).toBe(false);
    expect(isValidPackageAutomationName("basico ")).toBe(false);
  });
});

describe("ensureUniquePackageAutomationName", () => {
  it("adiciona sufixo quando já existe", () => {
    expect(ensureUniquePackageAutomationName("basico", ["basico"])).toBe("basico_2");
    expect(ensureUniquePackageAutomationName("basico", ["basico", "basico_2"])).toBe("basico_3");
  });
});

describe("resolvePackageAutomationNameForSave", () => {
  it("usa valor explícito quando informado", () => {
    expect(
      resolvePackageAutomationNameForSave({
        displayName: "Pacote Ouro",
        explicitAutomationName: "carrossel",
        existingAutomationNames: [],
      }),
    ).toBe("carrossel");
  });

  it("gera a partir do nome comercial quando explícito está vazio", () => {
    expect(
      resolvePackageAutomationNameForSave({
        displayName: "Pacote Básico",
        explicitAutomationName: "",
        existingAutomationNames: ["basico"],
      }),
    ).toBe("basico_2");
  });

  it("respeita nomes já ocupados quando o cliente ainda envia o candidato original", () => {
    expect(
      resolvePackageAutomationNameForSave({
        displayName: "pacote padrão",
        explicitAutomationName: "padrao",
        existingAutomationNames: ["padrao", "padrao_2"],
      }),
    ).toBe("padrao_3");
  });
});
