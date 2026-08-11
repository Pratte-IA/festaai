import { describe, expect, it } from "vitest";

import {
  findBrazilCity,
  formatCityName,
  isValidBrazilCity,
  normalizeCitySearch,
} from "@/lib/brazil-cities";

describe("brazil-cities", () => {
  it("normaliza busca sem acento e caixa", () => {
    expect(normalizeCitySearch("  São  José ")).toBe("sao jose");
    expect(normalizeCitySearch("CASCAVEL")).toBe("cascavel");
  });

  it("formata nome em title case pt-BR", () => {
    expect(formatCityName("CASCAVEL")).toBe("Cascavel");
    expect(formatCityName("ABATIÁ")).toBe("Abatiá");
    expect(formatCityName("AGUDOS DO SUL")).toBe("Agudos do Sul");
    expect(formatCityName("FOZ DO IGUAÇU")).toBe("Foz do Iguaçu");
  });

  it("valida cidade contra lista oficial", () => {
    const cities = [
      { codigoIbge: "4104808", nome: "Cascavel" },
      { codigoIbge: "4106902", nome: "Foz do Iguaçu" },
    ];

    expect(isValidBrazilCity("cascavel", cities)).toBe(true);
    expect(isValidBrazilCity("Cascavél", cities)).toBe(true);
    expect(isValidBrazilCity("Cascavell", cities)).toBe(false);
    expect(findBrazilCity("FOZ DO IGUACU", cities)?.nome).toBe("Foz do Iguaçu");
  });
});
