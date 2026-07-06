import { useMutation, useQuery } from "@tanstack/react-query";
import { FunctionsHttpError } from "@supabase/supabase-js";

import type { ClosingFormField } from "@/features/configuracoes/closing-form-types";
import {
  normalizeBuffetBlock,
  normalizeEquipe,
  normalizePackagePricing,
  parsePackageItems,
  type Additional,
  type PackageData,
} from "@/data/packagesData";
import { supabase } from "@/lib/supabase/client";

import type {
  ClientContractAcceptResult,
  ClientContractFormConfig,
  ClientContractFormSubmitResult,
} from "./types";
import type { BalancePaymentOption } from "./balance-payment-option";

const resolveFunctionError = async (error: unknown) => {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = (await error.context.json()) as { error?: string };
      if (body.error) return body.error;
    } catch {
      // mantém mensagem padrão
    }
  }

  if (error instanceof Error && error.message) return error.message;
  return "Tente novamente em instantes.";
};

const mapPackage = (row: Record<string, unknown>): PackageData => {
  const { schedule, tiers } = normalizePackagePricing(row.pricingTiers);

  return {
    active: Boolean(row.active),
    buffet: normalizeBuffetBlock(row.buffet),
    description: String(row.description ?? ""),
    durationMinutes: typeof row.durationMinutes === "number" ? row.durationMinutes : null,
    equipe: normalizeEquipe(row.equipe, tiers.map((tier) => tier.id)),
    estrutura: row.estrutura as PackageData["estrutura"],
    excludedItems: parsePackageItems(row.excludedItems),
    id: String(row.id),
    includedGuests: typeof row.includedGuests === "number" ? row.includedGuests : null,
    includedItems: parsePackageItems(row.includedItems),
    name: String(row.name),
    nameAutomacao: String(row.nameAutomacao ?? row.name_automacao ?? ""),
    pricingSchedule: schedule,
    pricingTiers: tiers,
    rules: typeof row.rules === "string" ? row.rules : null,
    sortOrder: typeof row.sortOrder === "number" ? row.sortOrder : 0,
  };
};

const mapAdditional = (row: Record<string, unknown>): Additional => ({
  active: Boolean(row.active),
  category: (row.category as Additional["category"]) ?? "outros",
  description: typeof row.description === "string" ? row.description : null,
  id: String(row.id),
  isRequired: Boolean(row.isRequired),
  name: String(row.name),
  packageIds: Array.isArray(row.packageIds) ? row.packageIds.map(String) : [],
  price: typeof row.price === "number" ? row.price : 0,
  sortOrder: typeof row.sortOrder === "number" ? row.sortOrder : 0,
  type: (row.type as Additional["type"]) ?? "fixo",
});

const mapField = (row: Record<string, unknown>): ClosingFormField => ({
  active: Boolean(row.active),
  category: (row.category as ClosingFormField["category"]) ?? "operacional",
  config: (row.config as Record<string, unknown>) ?? {},
  description: typeof row.description === "string" ? row.description : null,
  fieldKey: typeof row.fieldKey === "string" ? row.fieldKey : null,
  fieldType: row.fieldType as ClosingFormField["fieldType"],
  id: String(row.id),
  isLocked: false,
  isSystem: Boolean(row.isSystem),
  label: String(row.label),
  packageIds: Array.isArray(row.packageIds) ? row.packageIds.map(String) : [],
  required: Boolean(row.required),
  section: row.section as ClosingFormField["section"],
  sortOrder: typeof row.sortOrder === "number" ? row.sortOrder : 0,
  usage: {
    ai: false,
    checklist: false,
    contract: false,
    internalTask: false,
    partySummary: false,
    reports: false,
  },
});

interface PublicAcceptanceTermLike {
  active: boolean;
  appearsInContract: boolean;
  content: string;
  id: string;
  isRequired: boolean;
  showAtSigning?: boolean;
  showInForm?: boolean;
  sortOrder: number;
  termKey?: string | null;
  title: string;
}

const mapAcceptanceTerm = (term: PublicAcceptanceTermLike) => ({
  active: term.active,
  appearsInContract: term.appearsInContract,
  content: term.content,
  id: term.id,
  isRequired: term.isRequired,
  showAtSigning: term.showAtSigning ?? false,
  showInForm: term.showInForm ?? true,
  sortOrder: term.sortOrder,
  termKey: term.termKey ?? null,
  title: term.title,
});

const mapConfig = (data: Record<string, unknown>): ClientContractFormConfig => ({
  acceptanceTerms: ((data.acceptanceTerms as PublicAcceptanceTermLike[]) ?? []).map(mapAcceptanceTerm),
  additionals: ((data.additionals as Record<string, unknown>[]) ?? []).map(mapAdditional),
  fields: ((data.fields as Record<string, unknown>[]) ?? []).map(mapField),
  financialSettings: (data.financialSettings as ClientContractFormConfig["financialSettings"]) ?? null,
  maxVenueGuestCapacity:
    typeof data.maxVenueGuestCapacity === "number" && Number.isFinite(data.maxVenueGuestCapacity)
      ? data.maxVenueGuestCapacity
      : null,
  packages: ((data.packages as Record<string, unknown>[]) ?? []).map(mapPackage),
  paymentMethods: (data.paymentMethods as ClientContractFormConfig["paymentMethods"]) ?? [],
  signingTerms: ((data.signingTerms as PublicAcceptanceTermLike[]) ?? []).map(mapAcceptanceTerm),
  tenantName: String(data.tenantName),
  tenantSlug: String(data.tenantSlug),
});

export interface SubmitClientContractFormInput {
  acceptanceResponses: Array<{ accepted: boolean; termId: number }>;
  adicionaisSnapshot?: unknown;
  balancePaymentSchedule?: BalancePaymentOption | null;
  fieldValues: Record<string, string>;
  fields: Array<{
    fieldKey: string | null;
    fieldType: string;
    id: string;
    required: boolean;
  }>;
  pacoteId?: number | null;
  linkedEventoId?: number | null;
  packageEventoUpdates?: {
    pacote_convidados_inclusos?: number | null;
    pacote_nome?: string;
    valor_pacote?: number;
  };
  tenantSlug: string;
}

export interface AcceptClientContractInput {
  acceptedByCpf?: string;
  acceptedByEmail?: string;
  acceptedByName: string;
  acceptedByPhone?: string;
  acceptanceText?: string;
  clientPhone: string;
  contractId: number;
  eventoId: number;
  tenantSlug: string;
  termAcceptances: Array<{ accepted: boolean; termId: number }>;
}

export const useClientContractFormConfig = (tenantSlug: string | undefined) =>
  useQuery({
    enabled: Boolean(tenantSlug),
    queryFn: async (): Promise<ClientContractFormConfig> => {
      const { data, error } = await supabase.functions.invoke<Record<string, unknown>>(
        "client-contract-form",
        {
          body: {
            action: "load",
            tenantSlug,
          },
        },
      );

      if (error) throw new Error(await resolveFunctionError(error));
      if (!data || typeof data.error === "string") {
        throw new Error(typeof data?.error === "string" ? data.error : "Formulário indisponível.");
      }

      return mapConfig(data);
    },
    queryKey: ["public-contract-form", tenantSlug],
    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
  });

export const useSubmitClientContractForm = () =>
  useMutation({
    mutationFn: async (payload: SubmitClientContractFormInput): Promise<ClientContractFormSubmitResult> => {
      const { data, error } = await supabase.functions.invoke<ClientContractFormSubmitResult>(
        "client-contract-form",
        {
          body: {
            action: "submit",
            ...payload,
          },
        },
      );

      if (error) throw new Error(await resolveFunctionError(error));
      if (!data) throw new Error("Resposta vazia ao enviar o formulário.");
      if ("error" in data && typeof (data as { error?: string }).error === "string") {
        throw new Error((data as { error: string }).error);
      }

      return data;
    },
  });

export const useAcceptClientContract = () =>
  useMutation({
    mutationFn: async (payload: AcceptClientContractInput): Promise<ClientContractAcceptResult> => {
      const { data, error } = await supabase.functions.invoke<ClientContractAcceptResult>(
        "client-contract-form",
        {
          body: {
            action: "accept_contract",
            ...payload,
          },
        },
      );

      if (error) throw new Error(await resolveFunctionError(error));
      if (!data) throw new Error("Resposta vazia ao assinar o contrato.");
      if ("error" in data && typeof (data as { error?: string }).error === "string") {
        throw new Error((data as { error: string }).error);
      }

      return data;
    },
  });
