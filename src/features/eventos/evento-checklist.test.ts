import { describe, expect, it } from "vitest";

import { defaultChecklistConfig } from "@/data/checklistConfig";

import {
  buildEventChecklistState,
  calculateChecklistProgress,
  isChecklistComplete,
  parseChecklistConcluidos,
  shouldShowEventChecklist,
} from "./evento-checklist";

describe("evento-checklist", () => {
  it("exibe checklist apenas em planejamento e festa pronta", () => {
    expect(shouldShowEventChecklist("planejamento")).toBe(true);
    expect(shouldShowEventChecklist("festa_pronta")).toBe(true);
    expect(shouldShowEventChecklist("boas_vindas")).toBe(false);
    expect(shouldShowEventChecklist("contato_inicial")).toBe(false);
  });

  it("normaliza ids concluidos salvos no evento", () => {
    expect(parseChecklistConcluidos(["1", 2])).toEqual(["1", "2"]);
    expect(parseChecklistConcluidos(null)).toEqual([]);
  });

  it("calcula progresso e conclusao total", () => {
    const checklist = buildEventChecklistState(defaultChecklistConfig, []);
    expect(calculateChecklistProgress(checklist)).toBe(0);
    expect(isChecklistComplete(checklist)).toBe(false);

    const allItemIds = checklist.flatMap((category) => category.items.map((item) => item.id));
    const completed = buildEventChecklistState(defaultChecklistConfig, allItemIds);

    expect(calculateChecklistProgress(completed)).toBe(100);
    expect(isChecklistComplete(completed)).toBe(true);
  });
});
