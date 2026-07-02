import type { Json } from "@/lib/supabase/database.types";
import { formatBrazilPhoneFromDigits, normalizePhoneDigits } from "@/lib/phone";

import { AUTOMATION_TEMPLATE_CATALOG, isAutomationTemplateKey } from "./automation-catalog";
import type {
  AutomationTemplateBinding,
  AutomationTemplateBindingRow,
  AutomationTemplateKey,
} from "./types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const formatStoredForwardPhone = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const digits = normalizePhoneDigits(value);
  if (!digits) return null;
  return formatBrazilPhoneFromDigits(digits);
};

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
    const forwardPhone = formatStoredForwardPhone(entry.forwardPhone);

    bindings.push({ connectionId, forwardPhone, key });
  }

  return bindings;
};

export const mergeAutomationTemplateBindings = (
  stored: AutomationTemplateBinding[],
): AutomationTemplateBindingRow[] => {
  const storedByKey = new Map(stored.map((binding) => [binding.key, binding]));

  return AUTOMATION_TEMPLATE_CATALOG.map((template) => {
    const saved = storedByKey.get(template.key);

    return {
      ...template,
      connectionId: saved?.connectionId ?? null,
      forwardPhone: saved?.forwardPhone ?? null,
    };
  });
};

export const isAutomationBindingConfigured = (binding: AutomationTemplateBindingRow): boolean => {
  if (binding.bindingMode === "phone_number") {
    return Boolean(binding.forwardPhone?.trim());
  }

  return binding.connectionId !== null;
};

export const serializeAutomationTemplateBindings = (
  bindings: AutomationTemplateBindingRow[],
): Json => {
  return bindings.map((binding) => {
    if (binding.bindingMode === "phone_number") {
      return {
        forwardPhone: binding.forwardPhone
          ? normalizePhoneDigits(binding.forwardPhone)
          : null,
        key: binding.key,
      };
    }

    return {
      connectionId: binding.connectionId,
      key: binding.key,
    };
  });
};

export const createDefaultAutomationBindings = (): AutomationTemplateBindingRow[] =>
  mergeAutomationTemplateBindings([]);
