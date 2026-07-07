import {
  ChecklistCategory,
  defaultChecklistConfig,
  EventChecklistCategory,
  generateEventChecklist,
} from "@/data/checklistConfig";

import { PartyStage, Stage } from "./types";

export const CHECKLIST_VISIBLE_STAGES: PartyStage[] = ["planejamento", "festa_pronta"];

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

export const resolveEventChecklistConfig = (categories: ChecklistCategory[] | undefined): ChecklistCategory[] => {
  if (categories && categories.length > 0) {
    return categories;
  }

  return defaultChecklistConfig;
};

export const buildEventChecklistState = (
  categories: ChecklistCategory[],
  concluidos: string[],
): EventChecklistCategory[] => {
  const concluidosSet = new Set(concluidos);

  return generateEventChecklist(categories).map((category) => ({
    ...category,
    items: category.items.map((item) => ({
      ...item,
      done: concluidosSet.has(item.id),
    })),
  }));
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
