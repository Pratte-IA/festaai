export const CONTRACT_SIGNATURE_FOLLOWUP_TEMPLATE_KEY = "follow-up-assinatura-contrato";

export const CONTRACT_SIGNATURE_FOLLOWUP_INICIAL_EVENT =
  "contract_signature_followup.inicial";

export const CONTRACT_SIGNATURE_FOLLOWUP_LEMBRETE_EVENT =
  "contract_signature_followup.lembrete";

export const CONTRACT_SIGNATURE_FOLLOWUP_INICIAL_DELAY_HOURS = 3;

export const CONTRACT_SIGNATURE_FOLLOWUP_LEMBRETE_DELAY_HOURS = 6;

export const CONTRACT_SIGNATURE_FOLLOWUP_INICIAL_TEMPLATE =
  "follow-up-assinatura-contrato-inicial";

export const CONTRACT_SIGNATURE_FOLLOWUP_LEMBRETE_TEMPLATE =
  "follow-up-assinatura-contrato-lembrete";

export const CONTRACT_SIGNATURE_FOLLOWUP_TIMEZONE = "America/Sao_Paulo";

export const CONTRACT_SIGNATURE_FOLLOWUP_BUSINESS_HOUR_START = 8;

export const CONTRACT_SIGNATURE_FOLLOWUP_BUSINESS_HOUR_END = 18;

const getHourInTimezone = (date: Date, timeZone: string): number => {
  const formatted = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hourCycle: "h23",
    timeZone,
  }).format(date);
  const hour = Number.parseInt(formatted, 10);
  return Number.isNaN(hour) ? date.getHours() : hour % 24;
};

export const isWithinContractSignatureFollowupBusinessHours = (date = new Date()): boolean => {
  const hour = getHourInTimezone(date, CONTRACT_SIGNATURE_FOLLOWUP_TIMEZONE);
  return (
    hour >= CONTRACT_SIGNATURE_FOLLOWUP_BUSINESS_HOUR_START &&
    hour < CONTRACT_SIGNATURE_FOLLOWUP_BUSINESS_HOUR_END
  );
};

export const buildPublicContractFormUrl = (
  appUrl: string,
  tenantSlug: string,
  eventoId: number,
): string => {
  const base = appUrl.replace(/\/$/, "");
  return `${base}/formulario/${tenantSlug}?evento=${eventoId}`;
};
