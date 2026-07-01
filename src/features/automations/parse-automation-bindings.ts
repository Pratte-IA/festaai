import type { Json } from "@/lib/supabase/database.types";

import { AUTOMATION_TEMPLATE_CATALOG, isAutomationTemplateKey } from "./automation-catalog";
import type {
  AutomationTemplateBinding,
  AutomationTemplateBindingRow,
  AutomationTemplateKey,
} from "./types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const parseAutomationTemplateBindings = (
  raw: Json | null | undefined,
): AutomationTemplateBinding[] => {
  if (!Array.isArray(raw)) return [];

  const bindings: AutomationTemplateBinding[] = [];

  for (const entry of raw) {
    if (!isRecord(entry)) continue;

    const key = typeof entry.key === "string" ? entry.key.trim() : "";
    if (!isAutomationTemplateKey(key)) continue;

    const connectionId =
      typeof entry.connectionId === "number" && Number.isFinite(entry.connectionId)
        ? entry.connectionId
        : null;

    bindings.push({ connectionId, key });
  }

  return bindings;
};

export const mergeAutomationTemplateBindings = (
  stored: AutomationTemplateBinding[],
): AutomationTemplateBindingRow[] => {
  const connectionByKey = new Map<AutomationTemplateKey, number | null>(
    stored.map((binding) => [binding.key, binding.connectionId]),
  );

  return AUTOMATION_TEMPLATE_CATALOG.map((template) => ({
    ...template,
    connectionId: connectionByKey.get(template.key) ?? null,
  }));
};

export const serializeAutomationTemplateBindings = (
  bindings: AutomationTemplateBindingRow[],
): Json => {
  return bindings.map((binding) => ({
    connectionId: binding.connectionId,
    key: binding.key,
  }));
};
