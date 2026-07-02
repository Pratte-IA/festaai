import { describe, expect, it } from "vitest";

import { buildWhatsAppUrl, formatWhatsAppGreetingName } from "@/lib/whatsapp";

describe("whatsapp utils", () => {
  it("formata apenas o primeiro nome com capitalizacao simples", () => {
    expect(formatWhatsAppGreetingName("JOYCE A. HOFFMANN HANG")).toBe("Joyce");
    expect(formatWhatsAppGreetingName("maria silva")).toBe("Maria");
    expect(formatWhatsAppGreetingName(" João ")).toBe("João");
  });

  it("monta mensagem de saudacao com primeiro nome formatado", () => {
    const url = buildWhatsAppUrl("(48) 98479-1283", "JOYCE A. HOFFMANN HANG", "Olá, {{nome}}! Tudo bem?");
    expect(url).toContain(encodeURIComponent("Olá, Joyce! Tudo bem?"));
  });
});
