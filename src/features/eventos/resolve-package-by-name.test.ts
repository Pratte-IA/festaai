import { describe, expect, it } from "vitest";

import { normalizePackageMatchKey, resolvePackageByAutomationName, resolvePackageByName } from "./resolve-package-by-name";

const packages = [
  { id: "1", name: "Pacote Básico", nameAutomacao: "basico", active: true },
  { id: "2", name: "Super Básico", nameAutomacao: "super_basico", active: true },
  { id: "3", name: "Café", nameAutomacao: "cafe", active: true },
  { id: "4", name: "Café da Tarde", nameAutomacao: "cafe_da_tarde", active: true },
  { id: "5", name: "Inativo", nameAutomacao: "inativo", active: false },
];

describe("normalizePackageMatchKey", () => {
  it("remove acentos e prefixo pacote", () => {
    expect(normalizePackageMatchKey("  Pacote Básico ")).toBe("basico");
    expect(normalizePackageMatchKey("Café")).toBe("cafe");
  });
});

describe("resolvePackageByName", () => {
  it("aceita basico com e sem acento", () => {
    expect(resolvePackageByName("basico", packages)?.name).toBe("Pacote Básico");
    expect(resolvePackageByName("Básico", packages)?.name).toBe("Pacote Básico");
    expect(resolvePackageByName("PACOTE BASICO", packages)?.name).toBe("Pacote Básico");
  });

  it("prefere match exato quando ha nomes parecidos", () => {
    expect(resolvePackageByName("super basico", packages)?.name).toBe("Super Básico");
    expect(resolvePackageByName("basico", packages)?.name).toBe("Pacote Básico");
  });

  it("aceita cafe com e sem acento", () => {
    expect(resolvePackageByName("cafe", packages)?.name).toBe("Café");
    expect(resolvePackageByName("Café", packages)?.name).toBe("Café");
  });

  it("resolve quando o texto contem o nome cadastrado", () => {
    expect(resolvePackageByName("Quero o cafe da tarde", packages)?.name).toBe("Café da Tarde");
    expect(resolvePackageByName("festa pacote basico", packages)?.name).toBe("Pacote Básico");
  });

  it("ignora pacotes inativos", () => {
    expect(resolvePackageByName("inativo", packages)).toBeNull();
  });

  it("retorna null para texto vazio ou sem correspondencia", () => {
    expect(resolvePackageByName("", packages)).toBeNull();
    expect(resolvePackageByName("xyz inexistente", packages)).toBeNull();
  });
});

describe("resolvePackageByAutomationName", () => {
  it("resolve pelo identificador exato de automacao", () => {
    expect(resolvePackageByAutomationName("basico", packages)?.name).toBe("Pacote Básico");
    expect(resolvePackageByAutomationName("cafe_da_tarde", packages)?.name).toBe("Café da Tarde");
  });

  it("ignora pacotes inativos", () => {
    expect(resolvePackageByAutomationName("inativo", packages)).toBeNull();
  });
});
