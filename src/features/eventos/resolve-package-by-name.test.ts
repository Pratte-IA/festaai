import { describe, expect, it } from "vitest";

import { normalizePackageMatchKey, resolvePackageByName } from "./resolve-package-by-name";

const packages = [
  { id: "1", name: "Pacote Básico", active: true },
  { id: "2", name: "Super Básico", active: true },
  { id: "3", name: "Café", active: true },
  { id: "4", name: "Café da Tarde", active: true },
  { id: "5", name: "Inativo", active: false },
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
