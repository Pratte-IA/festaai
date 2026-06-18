import { describe, expect, it } from "vitest";

import { normalizePhoneDigits, phonesMatch } from "@/lib/phone";

describe("phone utils", () => {
  it("normaliza digitos", () => {
    expect(normalizePhoneDigits("(11) 99999-8888")).toBe("11999998888");
  });

  it("compara telefones com mascara e DDI", () => {
    expect(phonesMatch("11999998888", "+55 11 99999-8888")).toBe(true);
    expect(phonesMatch("11999998888", "11888887777")).toBe(false);
  });
});
