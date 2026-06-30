import { getContratarWhatsappUrl } from "@/pages/contratar-commercial-data";
import { WhatsappIcon } from "@/components/contratar/WhatsappIcon";

export const WhatsappFloatingButton = () => (
  <a
    aria-label="Chamar no WhatsApp"
    className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_4px_24px_rgba(37,211,102,0.45)] transition-transform hover:scale-105 hover:bg-[#1da851] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 focus-visible:ring-offset-[#07070c]"
    href={getContratarWhatsappUrl()}
    rel="noopener noreferrer"
    target="_blank"
  >
    <WhatsappIcon className="h-7 w-7" />
  </a>
);
