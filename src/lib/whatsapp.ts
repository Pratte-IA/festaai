import { toWhatsAppMePhone } from "@/lib/phone";

export const buildWhatsAppUrl = (
  phone: string | null | undefined,
  name: string,
  message: string,
): string | null => {
  const cleaned = toWhatsAppMePhone(phone);
  if (!cleaned) return null;

  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message.replace("{{nome}}", name))}`;
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
