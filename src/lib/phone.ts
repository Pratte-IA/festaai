/** Mantém apenas dígitos para comparação de telefones. */
export const normalizePhoneDigits = (phone: string | null | undefined): string =>
  (phone ?? "").replace(/\D/g, "");

export const stripBrazilCountryCode = (digits: string): string => {
  if (digits.startsWith("55") && digits.length >= 12) {
    return digits.slice(2);
  }

  return digits;
};

/**
 * Normaliza telefone BR para dígitos nacionais (10 fixo ou 11 celular).
 * Converte celular legado (8 dígitos após DDD) para o padrão com nono dígito.
 * Usado em cruzamentos (CRM x WhatsApp), não durante digitação no formulário.
 */
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

/** Dígitos nacionais informados pelo usuário (11 = DDD + 9 dígitos), sem conversão legado. */
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

/** Validação do formulário: exige DDD + 9 dígitos já digitados pelo cliente. */
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

export const isValidBrazilPhone = (phone: string | null | undefined): boolean => {
  const digits = normalizeBrazilPhoneDigits(phone);
  if (!digits) return false;

  const ddd = Number(digits.slice(0, 2));
  if (ddd < 11 || ddd > 99) return false;

  return digits.length === 10 || digits.length === 11;
};

/** Compara telefones BR ignorando máscara, DDI 55 e diferença 8/9 dígitos do celular. */
export const phonesMatch = (left: string | null | undefined, right: string | null | undefined): boolean => {
  const a = normalizeBrazilPhoneDigits(left);
  const b = normalizeBrazilPhoneDigits(right);

  return Boolean(a && b && a === b);
};

/**
 * Chave canônica para Evolution / WhatsApp / automação (n8n, memória do agente).
 * Formato: 55 + DDD + 8 dígitos do celular (sem o nono dígito adicionado pela Anatel).
 */
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

/** Número E.164 para links wa.me (com nono dígito do celular BR). */
export const toWhatsAppMePhone = (phone: string | null | undefined): string | null => {
  const national = normalizeBrazilPhoneDigits(phone);
  if (!national) return null;

  return `55${national}`;
};

/** Formata para exibição: celular (XX) XXXXX-XXXX ou fixo (XX) XXXX-XXXX. */
export const formatBrazilPhone = (phone: string | null | undefined): string => {
  const digits = normalizeBrazilPhoneDigits(phone);
  if (!digits) return phone?.trim() ?? "";

  return formatBrazilPhoneFromDigits(digits);
};

/**
 * Máscara de celular BR (DDD + 9 dígitos) enquanto o usuário digita.
 * Não converte formato legado — apenas formata os dígitos informados.
 */
export const applyBrazilMobilePhoneMask = (raw: string): string => {
  const digits = stripBrazilCountryCode(normalizePhoneDigits(raw)).slice(0, 11);

  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

/** Converte valor salvo (CRM / WhatsApp) para o input mascarado. */
export const toBrazilPhoneInputValue = (phone: string | null | undefined): string => {
  if (!phone?.trim()) return "";

  const normalized = normalizeBrazilPhoneDigits(phone);
  if (normalized) return applyBrazilMobilePhoneMask(normalized);

  return applyBrazilMobilePhoneMask(phone);
};

/**
 * Persistência canônica: 55 + DDD + 8 dígitos (chave Evolution/WhatsApp).
 * Usada em criação manual, webhook, importação CSV e formulário público.
 */
export const normalizeBrazilMobilePhoneForStorage = (phone: string | null | undefined): string | null => {
  if (!isValidBrazilMobilePhone(phone)) return null;

  return toWhatsAppPhoneKey(phone);
};

/** Persistência a partir de WhatsApp / legado (converte 8→9 dígitos quando necessário). */
export const normalizeBrazilPhoneForStorage = (phone: string | null | undefined): string | null => {
  const normalized = normalizeBrazilPhoneDigits(phone);
  if (!normalized || normalized.length !== 11 || normalized.charAt(2) !== "9") return null;

  return toWhatsAppPhoneKey(phone);
};

/** Resolve número para envio Evolution (aceita celular de formulário ou chave já armazenada). */
export const resolveWhatsAppPhoneForOutbound = (phone: string | null | undefined): string | null =>
  toWhatsAppPhoneKey(phone) ?? normalizeBrazilMobilePhoneForStorage(phone);
