import {
  normalizeBrazilPhoneDigits,
  toWhatsAppMePhone,
  toWhatsAppPhoneKey,
} from "./phone.ts";

/** Variantes canônicas do telefone para busca direta no banco (evita scan completo). */
export const buildPhoneLookupVariants = (phone: string | null | undefined): string[] => {
  if (!phone?.trim()) return [];

  const variants = new Set<string>([phone.trim()]);
  const national = normalizeBrazilPhoneDigits(phone);

  if (national) {
    variants.add(national);
    variants.add(`55${national}`);

    const whatsappKey = toWhatsAppPhoneKey(phone) ?? toWhatsAppPhoneKey(national);
    const waMePhone = toWhatsAppMePhone(phone) ?? toWhatsAppMePhone(national);

    if (whatsappKey) variants.add(whatsappKey);
    if (waMePhone) variants.add(waMePhone);
  }

  return [...variants].filter(Boolean);
};
