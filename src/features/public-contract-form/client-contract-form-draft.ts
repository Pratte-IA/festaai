import type { BalancePaymentOption } from "./balance-payment-option";

const DRAFT_VERSION = 1;

const isBalancePaymentOption = (value: unknown): value is BalancePaymentOption =>
  value === "7_dias_antes" || value === "mensal";

export interface ClientContractFormDraft {
  additionalSelections: Array<[string, number]>;
  balancePaymentOption: BalancePaymentOption | null;
  currentSectionIndex: number;
  fieldValues: Record<string, string>;
  savedAt: string;
  selectedPackageId: string | null;
  termResponses: Record<string, boolean | undefined>;
  version: number;
}

const buildDraftStorageKey = (tenantSlug: string) => `festaai.client-contract-form.${tenantSlug}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseDraft = (raw: string): ClientContractFormDraft | null => {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== DRAFT_VERSION) return null;

    const fieldValues = parsed.fieldValues;
    const termResponses = parsed.termResponses;
    const additionalSelections = parsed.additionalSelections;

    if (!isRecord(fieldValues) || !isRecord(termResponses) || !Array.isArray(additionalSelections)) {
      return null;
    }

    const normalizedFieldValues = Object.fromEntries(
      Object.entries(fieldValues).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
    );

    const normalizedTermResponses = Object.fromEntries(
      Object.entries(termResponses).filter(
        (entry): entry is [string, boolean | undefined] =>
          typeof entry[1] === "boolean" || entry[1] === undefined,
      ),
    );

    const normalizedAdditionalSelections = additionalSelections.filter(
      (entry): entry is [string, number] =>
        Array.isArray(entry) &&
        entry.length === 2 &&
        typeof entry[0] === "string" &&
        typeof entry[1] === "number",
    );

    return {
      additionalSelections: normalizedAdditionalSelections,
      balancePaymentOption: isBalancePaymentOption(parsed.balancePaymentOption)
        ? parsed.balancePaymentOption
        : null,
      currentSectionIndex:
        typeof parsed.currentSectionIndex === "number" && parsed.currentSectionIndex >= 0
          ? parsed.currentSectionIndex
          : 0,
      fieldValues: normalizedFieldValues,
      savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : new Date().toISOString(),
      selectedPackageId: typeof parsed.selectedPackageId === "string" ? parsed.selectedPackageId : null,
      termResponses: normalizedTermResponses,
      version: DRAFT_VERSION,
    };
  } catch {
    return null;
  }
};

export const loadClientContractFormDraft = (tenantSlug: string): ClientContractFormDraft | null => {
  if (typeof window === "undefined" || !tenantSlug) return null;

  const raw = window.localStorage.getItem(buildDraftStorageKey(tenantSlug));
  if (!raw) return null;

  return parseDraft(raw);
};

export const saveClientContractFormDraft = (
  tenantSlug: string,
  draft: Omit<ClientContractFormDraft, "savedAt" | "version">,
): void => {
  if (typeof window === "undefined" || !tenantSlug) return;

  const payload: ClientContractFormDraft = {
    ...draft,
    savedAt: new Date().toISOString(),
    version: DRAFT_VERSION,
  };

  window.localStorage.setItem(buildDraftStorageKey(tenantSlug), JSON.stringify(payload));
};

export const clearClientContractFormDraft = (tenantSlug: string): void => {
  if (typeof window === "undefined" || !tenantSlug) return;
  window.localStorage.removeItem(buildDraftStorageKey(tenantSlug));
};
