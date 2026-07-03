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

export const extractFirstName = (fullName: string | null | undefined): string => {
  const trimmed = (fullName ?? "").trim();
  if (!trimmed) return "Cliente";
  return trimmed.split(/\s+/)[0] ?? trimmed;
};
