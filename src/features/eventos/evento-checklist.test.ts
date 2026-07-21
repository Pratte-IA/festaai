import { describe, expect, it } from "vitest";

import { defaultChecklistConfig } from "@/data/checklistConfig";

import type { AdicionalSnapshotItem } from "./closing-form-runtime";
import {
  ADICIONAIS_CHECKLIST_CATEGORY_ID,
  buildAdicionalChecklistItemId,
  buildEventChecklistState,
  calculateChecklistProgress,
  createChecklistExtraItem,
  isChecklistComplete,
  ITENS_EXTRAS_CHECKLIST_CATEGORY_ID,
  parseChecklistConcluidos,
  parseChecklistExtras,
  shouldShowEventChecklist,
} from "./evento-checklist";

const adicional = (overrides: Partial<AdicionalSnapshotItem> = {}): AdicionalSnapshotItem => ({
  category: "buffet",
  id: 10,
  name: "Mesa de doces",
  price: 200,
  quantity: 1,
  subtotal: 200,
  type: "fixo",
  ...overrides,
});

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

  it("normaliza itens extras salvos no evento", () => {
    expect(
      parseChecklistExtras([
        { id: "extra-1", label: " Food truck " },
        { id: 2, label: "invalido" },
        { id: "extra-2", label: "" },
      ]),
    ).toEqual([{ id: "extra-1", label: "Food truck" }]);
    expect(parseChecklistExtras(null)).toEqual([]);
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

  it("inclui automaticamente adicionais contratados do formulario", () => {
    const checklist = buildEventChecklistState(defaultChecklistConfig, [], [
      adicional({ id: 10, name: "Mesa de doces" }),
      adicional({ id: 11, name: "Garçom", quantity: 2, category: "equipe" }),
    ]);

    const adicionaisCategory = checklist.find(
      (category) => category.categoryId === ADICIONAIS_CHECKLIST_CATEGORY_ID,
    );

    expect(adicionaisCategory?.name).toBe("Adicionais");
    expect(adicionaisCategory?.items).toEqual([
      { id: buildAdicionalChecklistItemId(10), label: "Mesa de doces", done: false },
      { id: buildAdicionalChecklistItemId(11), label: "Garçom (2x)", done: false },
    ]);
  });

  it("sempre inclui a categoria Itens Extras", () => {
    const checklist = buildEventChecklistState(defaultChecklistConfig, []);
    const extrasCategory = checklist.find(
      (category) => category.categoryId === ITENS_EXTRAS_CHECKLIST_CATEGORY_ID,
    );

    expect(extrasCategory?.name).toBe("Itens Extras");
    expect(extrasCategory?.items).toEqual([]);
  });

  it("inclui itens extras da festa no checklist", () => {
    const extra = createChecklistExtraItem("Confirmar food truck");
    const checklist = buildEventChecklistState(defaultChecklistConfig, [extra.id], [], [extra]);
    const extrasCategory = checklist.find(
      (category) => category.categoryId === ITENS_EXTRAS_CHECKLIST_CATEGORY_ID,
    );

    expect(extrasCategory?.items).toEqual([
      { id: extra.id, label: "Confirmar food truck", done: true },
    ]);
  });

  it("marca adicionais ja concluidos no progresso", () => {
    const itemId = buildAdicionalChecklistItemId(10);
    const checklist = buildEventChecklistState(defaultChecklistConfig, [itemId], [
      adicional({ id: 10, name: "Mesa de doces" }),
    ]);

    const adicionaisCategory = checklist.find(
      (category) => category.categoryId === ADICIONAIS_CHECKLIST_CATEGORY_ID,
    );

    expect(adicionaisCategory?.items[0]?.done).toBe(true);
  });
});
