import { toWhatsAppMePhone } from "@/lib/phone";

export const formatWhatsAppGreetingName = (fullName: string | null | undefined): string => {
  const trimmed = fullName?.trim() ?? "";
  if (!trimmed) return "";

  const firstName = trimmed.split(/\s+/)[0] ?? trimmed;
  if (!firstName) return "";

  return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
};

export const buildWhatsAppUrl = (
  phone: string | null | undefined,
  name: string,
  message: string,
): string | null => {
  const cleaned = toWhatsAppMePhone(phone);
  if (!cleaned) return null;

  const greetingName = formatWhatsAppGreetingName(name);

  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message.replace("{{nome}}", greetingName))}`;
};

export const openWhatsApp = (phone: string | null, name: string, message: string) => {
  const url = buildWhatsAppUrl(phone, name, message);
  if (!url) return;

  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
};
