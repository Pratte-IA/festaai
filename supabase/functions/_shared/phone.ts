/** Mantém apenas dígitos para comparação de telefones. */
export const normalizePhoneDigits = (phone: string | null | undefined): string =>
  (phone ?? "").replace(/\D/g, "");

export const stripBrazilCountryCode = (digits: string): string => {
  if (digits.startsWith("55") && digits.length >= 12) {
    return digits.slice(2);
  }

  return digits;
};

export const normalizeBrazilPhoneDigits = (phone: string | null | undefined): string | null => {
  const raw = (phone ?? "").split("@")[0] ?? phone ?? "";
  let digits = stripBrazilCountryCode(normalizePhoneDigits(raw));

  if (digits.length < 10 || digits.length > 11) return null;

  const ddd = digits.slice(0, 2);
  const local = digits.slice(2);

  if (local.length === 8 && /^[6-9]/.test(local)) {
    return `${ddd}9${local}`;
  }

  if (local.length === 9) {
    return `${ddd}${local}`;
  }

  if (local.length === 8) {
    return `${ddd}${local}`;
  }

  return null;
};

export const parseBrazilMobilePhoneInputDigits = (phone: string | null | undefined): string | null => {
  const digits = stripBrazilCountryCode(normalizePhoneDigits(phone));
  return digits.length === 11 ? digits : null;
};

export const formatBrazilPhoneFromDigits = (digits: string): string => {
  const ddd = digits.slice(0, 2);

  if (digits.length === 11) {
    return `(${ddd}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 10) {
    return `(${ddd}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return digits;
};

export const isValidBrazilMobilePhone = (phone: string | null | undefined): boolean => {
  const digits = parseBrazilMobilePhoneInputDigits(phone);
  if (!digits) return false;

  const ddd = Number(digits.slice(0, 2));
  if (ddd < 11 || ddd > 99) return false;

  return digits.charAt(2) === "9";
};

export const getBrazilMobilePhoneValidationError = (phone: string | null | undefined): string | null => {
  const raw = stripBrazilCountryCode(normalizePhoneDigits(phone));

  if (!raw) return "Este campo é obrigatório.";
  if (raw.length < 11) {
    return "Informe o celular completo com DDD e 9 dígitos (ex: (45) 99978-5617).";
  }
  if (raw.length > 11) return "Celular inválido. Use DDD + 9 dígitos.";
  if (raw.charAt(2) !== "9") {
    return "Celular inválido. O número deve começar com 9 após o DDD.";
  }

  const ddd = Number(raw.slice(0, 2));
  if (ddd < 11 || ddd > 99) return "DDD inválido.";

  return null;
};

export const phonesMatch = (left: string | null | undefined, right: string | null | undefined): boolean => {
  const a = normalizeBrazilPhoneDigits(left);
  const b = normalizeBrazilPhoneDigits(right);

  return Boolean(a && b && a === b);
};

export const toWhatsAppPhoneKey = (phone: string | null | undefined): string | null => {
  const national = normalizeBrazilPhoneDigits(phone);
  if (!national) return null;

  const ddd = national.slice(0, 2);
  const local = national.slice(2);

  if (local.length === 9 && local.startsWith("9")) {
    return `55${ddd}${local.slice(1)}`;
  }

  return `55${national}`;
};

export const formatBrazilPhone = (phone: string | null | undefined): string => {
  const digits = normalizeBrazilPhoneDigits(phone);
  if (!digits) return phone?.trim() ?? "";

  return formatBrazilPhoneFromDigits(digits);
};

export const normalizeBrazilMobilePhoneForStorage = (phone: string | null | undefined): string | null => {
  if (!isValidBrazilMobilePhone(phone)) return null;

  return toWhatsAppPhoneKey(phone);
};

export const normalizeBrazilPhoneForStorage = (phone: string | null | undefined): string | null => {
  const normalized = normalizeBrazilPhoneDigits(phone);
  if (!normalized || normalized.length !== 11 || normalized.charAt(2) !== "9") return null;

  return toWhatsAppPhoneKey(phone);
};

/** Resolve número para envio Evolution (aceita celular de formulário ou chave já armazenada). */
export const resolveWhatsAppPhoneForOutbound = (phone: string | null | undefined): string | null =>
  toWhatsAppPhoneKey(phone) ?? normalizeBrazilMobilePhoneForStorage(phone);
