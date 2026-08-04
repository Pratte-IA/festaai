import { describe, expect, it } from "vitest";

import { isValidCompetenciaMonth, parseCompetenciaMonth } from "./month-range";

describe("competencia month validation", () => {
  it("aceita meses validos", () => {
    expect(isValidCompetenciaMonth("2026-08")).toBe(true);
    expect(parseCompetenciaMonth("2026-08-03")).toBe("2026-08");
  });

  it("rejeita ano 0002 e formatos invalidos", () => {
    expect(isValidCompetenciaMonth("0002-08")).toBe(false);
    expect(parseCompetenciaMonth("0002-08-01")).toBeNull();
    expect(parseCompetenciaMonth("2026-13")).toBeNull();
    expect(parseCompetenciaMonth("")).toBeNull();
  });
});
