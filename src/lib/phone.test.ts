import { describe, expect, it } from "vitest";

import {
  applyBrazilMobilePhoneMask,
  formatBrazilPhone,
  getBrazilMobilePhoneValidationError,
  isValidBrazilMobilePhone,
  normalizeBrazilPhoneDigits,
  normalizeBrazilPhoneForStorage,
  normalizeBrazilMobilePhoneForStorage,
  normalizePhoneDigits,
  phonesMatch,
  toBrazilPhoneInputValue,
  toWhatsAppMePhone,
  toWhatsAppPhoneKey,
} from "@/lib/phone";

describe("phone utils", () => {
  it("normaliza digitos", () => {
    expect(normalizePhoneDigits("(11) 99999-8888")).toBe("11999998888");
  });

  it("converte celular legado (8 digitos) para nono digito", () => {
    expect(normalizeBrazilPhoneDigits("554599785617")).toBe("45999785617");
    expect(normalizeBrazilPhoneDigits("4599785617")).toBe("45999785617");
    expect(normalizeBrazilPhoneDigits("(45) 99978-5617")).toBe("45999785617");
  });

  it("compara telefones com mascara, DDI e formato legado vs atual", () => {
    expect(phonesMatch("554599785617", "(45) 99978-5617")).toBe(true);
    expect(phonesMatch("4599785617", "45999785617")).toBe(true);
    expect(phonesMatch("11999998888", "+55 11 99999-8888")).toBe(true);
    expect(phonesMatch("11999998888", "11888887777")).toBe(false);
  });

  it("gera chave WhatsApp/Evolution sem o nono digito", () => {
    expect(toWhatsAppPhoneKey("(45) 99978-5617")).toBe("554599785617");
    expect(toWhatsAppPhoneKey("5545999785617")).toBe("554599785617");
    expect(toWhatsAppPhoneKey("554599785617@s.whatsapp.net")).toBe("554599785617");
  });

  it("gera numero E.164 para links wa.me com nono digito", () => {
    expect(toWhatsAppMePhone("(48) 98479-1283")).toBe("5548984791283");
    expect(toWhatsAppMePhone("(45) 99978-5617")).toBe("5545999785617");
  });

  it("nao confunde celulares diferentes com mesmo sufixo parcial", () => {
    expect(phonesMatch("45999785617", "45998885617")).toBe(false);
  });

  it("formata celular para exibicao BR", () => {
    expect(formatBrazilPhone("554599785617")).toBe("(45) 99978-5617");
    expect(formatBrazilPhone("45999785617")).toBe("(45) 99978-5617");
  });

  it("persiste telefone legado via WhatsApp no formato 55ddd8digitos", () => {
    expect(normalizeBrazilPhoneForStorage("554599785617")).toBe("554599785617");
    expect(normalizeBrazilPhoneForStorage("4599785617")).toBe("554599785617");
    expect(normalizeBrazilPhoneForStorage("(48) 98403-8841")).toBe("554884038841");
  });

  it("persiste telefone do formulario apenas com 11 digitos informados", () => {
    expect(normalizeBrazilMobilePhoneForStorage("(45) 99978-5617")).toBe("554599785617");
    expect(normalizeBrazilMobilePhoneForStorage("4599785617")).toBeNull();
  });

  it("nao insere nono digito extra durante digitacao", () => {
    let value = "";
    for (const digit of "45999785617") {
      value = applyBrazilMobilePhoneMask(value + digit);
    }
    expect(value).toBe("(45) 99978-5617");
  });

  it("toBrazilPhoneInputValue nao deve ser usado durante digitacao parcial", () => {
    expect(applyBrazilMobilePhoneMask("4599978561")).toBe("(45) 99978-561");
    // Normalização legado em input incompleto distorce o número — PhoneInput evita isso.
    expect(toBrazilPhoneInputValue("(45) 99978-561")).toBe("(45) 99997-8561");
  });

  it("carrega telefone salvo ou vindo do WhatsApp no input", () => {
    expect(toBrazilPhoneInputValue("554599785617")).toBe("(45) 99978-5617");
  });

  it("valida formulario com mensagem quando faltam digitos", () => {
    expect(isValidBrazilMobilePhone("(45) 99978-561")).toBe(false);
    expect(getBrazilMobilePhoneValidationError("(45) 9978-5617")).toMatch(/9 dígitos/i);
    expect(getBrazilMobilePhoneValidationError("(45) 99978-5617")).toBeNull();
  });
});
