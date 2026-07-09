const LEGAL_SUFFIX_PATTERN =
  /\s*[-–—,]?\s*(ltda\.?|l\.?\s*t\.?\s*d\.?\s*a\.?|me\.?|mei\.?|eireli\.?|epp\.?|s\/a\.?|s\.?\s*a\.?)\.?$/i;

/** Nome comercial amigável — remove sufixos jurídicos (LTDA, ME, S/A etc.). */
export const formatCompanyDisplayName = (legalName: string): string => {
  let result = legalName.trim();
  if (!result) return "";

  while (LEGAL_SUFFIX_PATTERN.test(result)) {
    result = result.replace(LEGAL_SUFFIX_PATTERN, "").trim();
  }

  return result || legalName.trim();
};

const capitalizeNamePart = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

const COMPOUND_FIRST_NAME_PREFIXES = new Set([
  "ana",
  "antonio",
  "antônio",
  "francisco",
  "joao",
  "joão",
  "jose",
  "josé",
  "luis",
  "luiz",
  "luisa",
  "luísa",
  "maria",
  "pedro",
  "raimundo",
]);

/** Primeiro nome para exibição, incluindo nomes compostos comuns (ex.: Maria Clara). */
export const extractDisplayFirstName = (fullName: string | null | undefined): string => {
  const trimmed = (fullName ?? "").trim();
  if (!trimmed) return "—";

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";

  const first = parts[0].toLowerCase();

  if (parts.length >= 2 && COMPOUND_FIRST_NAME_PREFIXES.has(first)) {
    return `${capitalizeNamePart(parts[0])} ${capitalizeNamePart(parts[1])}`;
  }

  return capitalizeNamePart(parts[0]);
};

export const extractFirstName = (fullName: string | null | undefined): string => {
  const trimmed = (fullName ?? "").trim();
  if (!trimmed) return "Cliente";
  return trimmed.split(/\s+/)[0] ?? trimmed;
};
