export const onlyDigits = (value: string) => value.replace(/\D/g, "");

export const formatCpfInput = (value: string) => {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

export const formatCnpjInput = (value: string) => {
  const digits = onlyDigits(value).slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
};

export const formatCepInput = (value: string) => {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

export const isValidCpf = (value: string) => onlyDigits(value).length === 11;

export const isValidCnpj = (value: string) => onlyDigits(value).length === 14;

export const isValidCep = (value: string) => onlyDigits(value).length === 8;

export const formatCnpjDisplay = (value: string | null | undefined) => {
  const digits = onlyDigits(value ?? "");
  if (digits.length !== 14) return value?.trim() || "";
  return formatCnpjInput(digits);
};

export const formatCpfDisplay = (value: string | null | undefined) => {
  const digits = onlyDigits(value ?? "");
  if (digits.length !== 11) return value?.trim() || "";
  return formatCpfInput(digits);
};

export const formatCepDisplay = (value: string | null | undefined) => {
  const digits = onlyDigits(value ?? "");
  if (digits.length !== 8) return value?.trim() || "";
  return formatCepInput(digits);
};
