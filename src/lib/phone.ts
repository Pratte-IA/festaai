/** Mantém apenas dígitos para comparação de telefones. */
export const normalizePhoneDigits = (phone: string | null | undefined): string =>
  (phone ?? "").replace(/\D/g, "");

/** Compara telefones BR ignorando máscara e, se necessário, DDI 55. */
export const phonesMatch = (left: string | null | undefined, right: string | null | undefined): boolean => {
  const a = normalizePhoneDigits(left);
  const b = normalizePhoneDigits(right);

  if (!a || !b) return false;
  if (a === b) return true;

  const suffixA = a.length > 11 && a.startsWith("55") ? a.slice(2) : a;
  const suffixB = b.length > 11 && b.startsWith("55") ? b.slice(2) : b;

  if (suffixA === suffixB) return true;

  const coreA = suffixA.length >= 10 ? suffixA.slice(-10) : suffixA;
  const coreB = suffixB.length >= 10 ? suffixB.slice(-10) : suffixB;

  return coreA.length >= 10 && coreA === coreB;
};
