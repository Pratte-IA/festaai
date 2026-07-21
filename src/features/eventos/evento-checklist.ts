import {
  ChecklistCategory,
  defaultChecklistConfig,
  EventChecklistCategory,
  generateEventChecklist,
} from "@/data/checklistConfig";

import type { AdicionalSnapshotItem } from "./closing-form-runtime";
import { ChecklistExtraItem, PartyStage, Stage } from "./types";

export const CHECKLIST_VISIBLE_STAGES: PartyStage[] = ["planejamento", "festa_pronta"];

export const ADICIONAIS_CHECKLIST_CATEGORY_ID = "adicionais-contratados";
export const ITENS_EXTRAS_CHECKLIST_CATEGORY_ID = "itens-extras";

export const shouldShowEventChecklist = (stage: Stage): boolean =>
  CHECKLIST_VISIBLE_STAGES.includes(stage as PartyStage);

export const parseChecklistConcluidos = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => typeof item === "string" || typeof item === "number")
    .map(String);
};

export const parseChecklistExtras = (value: unknown): ChecklistExtraItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const row = item as Record<string, unknown>;
    if (typeof row.id !== "string" || typeof row.label !== "string") {
      return [];
    }

    const label = row.label.trim();
    if (!label) {
      return [];
    }

    return [{ id: row.id, label }];
  });
};

export const resolveEventChecklistConfig = (categories: ChecklistCategory[] | undefined): ChecklistCategory[] => {
  if (categories && categories.length > 0) {
    return categories;
  }

  return defaultChecklistConfig;
};

export const buildAdicionalChecklistItemId = (adicionalId: number): string =>
  `adicional-${adicionalId}`;

export const createChecklistExtraItem = (label: string): ChecklistExtraItem => ({
  id: `extra-${crypto.randomUUID()}`,
  label: label.trim(),
});

export const formatAdicionalChecklistLabel = (item: AdicionalSnapshotItem): string =>
  item.quantity > 1 ? `${item.name} (${item.quantity}x)` : item.name;

export const buildAdicionaisChecklistCategory = (
  adicionais: AdicionalSnapshotItem[],
  concluidos: string[],
): EventChecklistCategory | null => {
  if (adicionais.length === 0) {
    return null;
  }

  const concluidosSet = new Set(concluidos);

  return {
    categoryId: ADICIONAIS_CHECKLIST_CATEGORY_ID,
    name: "Adicionais",
    items: adicionais.map((item) => {
      const id = buildAdicionalChecklistItemId(item.id);

      return {
        id,
        label: formatAdicionalChecklistLabel(item),
        done: concluidosSet.has(id),
      };
    }),
  };
};

export const buildItensExtrasChecklistCategory = (
  extras: ChecklistExtraItem[],
  concluidos: string[],
): EventChecklistCategory => {
  const concluidosSet = new Set(concluidos);

  return {
    categoryId: ITENS_EXTRAS_CHECKLIST_CATEGORY_ID,
    name: "Itens Extras",
    items: extras.map((item) => ({
      id: item.id,
      label: item.label,
      done: concluidosSet.has(item.id),
    })),
  };
};

export const buildEventChecklistState = (
  categories: ChecklistCategory[],
  concluidos: string[],
  adicionais: AdicionalSnapshotItem[] = [],
  extras: ChecklistExtraItem[] = [],
): EventChecklistCategory[] => {
  const concluidosSet = new Set(concluidos);

  const base = generateEventChecklist(categories).map((category) => ({
    ...category,
    items: category.items.map((item) => ({
      ...item,
      done: concluidosSet.has(item.id),
    })),
  }));

  const adicionaisCategory = buildAdicionaisChecklistCategory(adicionais, concluidos);
  const extrasCategory = buildItensExtrasChecklistCategory(extras, concluidos);

  return [
    ...base,
    ...(adicionaisCategory ? [adicionaisCategory] : []),
    extrasCategory,
  ];
};

export const calculateChecklistProgress = (checklist: EventChecklistCategory[]): number => {
  const allItems = checklist.flatMap((category) => category.items);

  if (allItems.length === 0) {
    return 0;
  }

  return Math.round((allItems.filter((item) => item.done).length / allItems.length) * 100);
};

export const isChecklistComplete = (checklist: EventChecklistCategory[]): boolean => {
  const allItems = checklist.flatMap((category) => category.items);
  return allItems.length > 0 && allItems.every((item) => item.done);
};
