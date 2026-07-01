import { asaasRequest } from "./asaas-client.ts";

export const ANNUAL_ADJUSTMENT_INDEX = "IPCA";
export const ANNUAL_ADJUSTMENT_NOTICE_DAYS = 30;

export type AsaasSubscriptionDetail = {
  id: string;
  status?: string;
  value?: number;
};

const addYearsISO = (fromISO: string, years = 1) => {
  const date = new Date(fromISO);
  date.setFullYear(date.getFullYear() + years);
  return date.toISOString();
};

export const computeNextAnnualAdjustmentAt = (fromISO: string, years = 1) =>
  addYearsISO(fromISO, years);

export const computeAnnualAdjustmentNoticeAt = (
  adjustmentAtISO: string,
  daysBefore = ANNUAL_ADJUSTMENT_NOTICE_DAYS,
) => {
  const date = new Date(adjustmentAtISO);
  date.setDate(date.getDate() - daysBefore);
  return date.toISOString();
};

/** IPCA acumulado 12 meses via API do BCB (série 433). */
export const fetchIpcaAccumulatedRate = async (): Promise<number | null> => {
  try {
    const response = await fetch(
      "https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados/ultimos/12?formato=json",
    );
    if (!response.ok) return null;

    const rows = (await response.json()) as Array<{ valor: string }>;
    if (!rows.length) return null;

    let factor = 1;
    for (const row of rows) {
      const monthly = Number(row.valor);
      if (!Number.isFinite(monthly)) continue;
      factor *= 1 + monthly / 100;
    }

    return factor - 1;
  } catch {
    return null;
  }
};

export const resolveAnnualAdjustmentRate = async (): Promise<number> => {
  const override = Deno.env.get("BILLING_ANNUAL_ADJUSTMENT_RATE");
  if (override) {
    const parsed = Number(override);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }

  const ipca = await fetchIpcaAccumulatedRate();
  if (ipca != null && ipca >= 0) return ipca;

  const fallback = Number(Deno.env.get("BILLING_ANNUAL_ADJUSTMENT_FALLBACK_RATE") ?? "0");
  if (Number.isFinite(fallback) && fallback >= 0) return fallback;

  throw new Error("Não foi possível determinar o índice de reajuste anual.");
};

export const applyAnnualAdjustmentRate = (currentPrice: number, rate: number) =>
  Math.round(currentPrice * (1 + rate) * 100) / 100;

export const updateAsaasSubscriptionValue = async (
  providerSubscriptionId: string,
  newValue: number,
  description?: string,
) =>
  asaasRequest<AsaasSubscriptionDetail>(`/subscriptions/${providerSubscriptionId}`, {
    body: JSON.stringify({
      ...(description ? { description } : {}),
      updatePendingPayments: true,
      value: newValue,
    }),
    method: "PUT",
  });

export const buildAnnualAdjustmentNoticeParams = (input: {
  appUrl: string;
  companyName: string;
  effectiveDate: string;
  indexLabel: string;
  name: string;
  newMonthlyPrice: number;
  noticeDaysAhead?: number;
  previousMonthlyPrice: number;
  ratePercent: number;
}) => ({
  appUrl: input.appUrl,
  companyName: input.companyName,
  ctaLabel: "Ver minha assinatura",
  ctaUrl: `${input.appUrl.replace(/\/$/, "")}/minha-assinatura`,
  effectiveDate: input.effectiveDate,
  indexLabel: input.indexLabel,
  name: input.name,
  newMonthlyPrice: input.newMonthlyPrice.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  }),
  noticeDaysAhead: String(input.noticeDaysAhead ?? 30),
  previousMonthlyPrice: input.previousMonthlyPrice.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  }),
  ratePercent: (input.ratePercent * 100).toFixed(2),
});
