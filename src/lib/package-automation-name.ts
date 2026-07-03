const ACCENT_FROM = "áàâãäéèêëíìîïóòôõöúùûüçñ";
const ACCENT_TO = "aaaaaeeeeiiiiooooouuuucn";

export const PACKAGE_AUTOMATION_NAME_PATTERN = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;

const stripAccents = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[áàâãäéèêëíìîïóòôõöúùûüçñ]/gi, (char) => {
      const index = ACCENT_FROM.indexOf(char.toLowerCase());
      return index >= 0 ? ACCENT_TO[index] : char;
    });

/** Gera identificador a partir do nome comercial (remove "Pacote", acentos e usa snake_case). */
export const buildPackageAutomationName = (displayName: string): string => {
  const normalized = stripAccents(displayName.trim().toLowerCase())
    .replace(/^pacote\s+/i, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized || "pacote";
};

/** Normaliza texto digitado manualmente no campo de automação. */
export const sanitizePackageAutomationNameInput = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

export const isValidPackageAutomationName = (value: string): boolean =>
  PACKAGE_AUTOMATION_NAME_PATTERN.test(value);

export const ensureUniquePackageAutomationName = (
  candidate: string,
  taken: string[],
): string => {
  const reserved = new Set(taken.map((item) => item.trim()).filter(Boolean));
  if (!reserved.has(candidate)) return candidate;

  let suffix = 2;
  while (reserved.has(`${candidate}_${suffix}`)) {
    suffix += 1;
  }

  return `${candidate}_${suffix}`;
};

export const resolvePackageAutomationNameForSave = ({
  displayName,
  explicitAutomationName,
  existingAutomationNames,
  currentAutomationName,
}: {
  displayName: string;
  explicitAutomationName: string | null | undefined;
  existingAutomationNames: string[];
  currentAutomationName?: string | null;
}): string => {
  const taken = existingAutomationNames.filter(
    (name) => name !== (currentAutomationName ?? undefined),
  );

  const candidate = explicitAutomationName?.trim()
    ? sanitizePackageAutomationNameInput(explicitAutomationName)
    : buildPackageAutomationName(displayName);

  if (!isValidPackageAutomationName(candidate)) {
    throw new Error(
      "Identificador para automação inválido. Use letras minúsculas, números e underscore (ex.: basico, roda_gigante).",
    );
  }

  return ensureUniquePackageAutomationName(candidate, taken);
};
