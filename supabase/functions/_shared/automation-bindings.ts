export interface AutomationBinding {
  connectionId: number | null;
  forwardPhone: string | null;
  key: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const parseAutomationBindings = (raw: unknown): AutomationBinding[] => {
  if (!Array.isArray(raw)) return [];

  const bindings: AutomationBinding[] = [];

  for (const entry of raw) {
    if (!isRecord(entry)) continue;

    const key = typeof entry.key === "string" ? entry.key.trim() : "";
    if (!key) continue;

    const connectionId =
      typeof entry.connectionId === "number" && Number.isFinite(entry.connectionId)
        ? entry.connectionId
        : null;
    const forwardPhone =
      typeof entry.forwardPhone === "string" && entry.forwardPhone.trim()
        ? entry.forwardPhone.trim()
        : null;

    bindings.push({ connectionId, forwardPhone, key });
  }

  return bindings;
};

export const resolveAutomationConnectionId = (
  rawBindings: unknown,
  templateKey: string,
): number | null =>
  parseAutomationBindings(rawBindings).find((binding) => binding.key === templateKey)?.connectionId ??
  null;
