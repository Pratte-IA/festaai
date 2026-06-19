import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

import {
  CONTRACT_MODULE_ACCEPTANCE_DECLARATION,
  CONTRACT_MODULE_TERMS_VERSION,
} from "./contracts/contract-module-terms";
import { eventosQueryKeys } from "./query-keys";

type ContractModuleAcceptanceRow = {
  accepted_at: string;
  accepted_by_cpf: string | null;
  accepted_by_email: string | null;
  accepted_by_name: string;
  accepted_by_user_id: string;
  acceptance_text: string;
  id: number;
  terms_version: number;
  user_agent: string | null;
};

export interface TenantContractModuleAcceptance {
  acceptedAt: string;
  acceptedByCpf: string | null;
  acceptedByEmail: string | null;
  acceptedByName: string;
  acceptedByUserId: string;
  acceptanceText: string;
  id: string;
  termsVersion: number;
  userAgent: string | null;
}

const mapAcceptanceRow = (row: ContractModuleAcceptanceRow): TenantContractModuleAcceptance => ({
  acceptedAt: row.accepted_at,
  acceptedByCpf: row.accepted_by_cpf,
  acceptedByEmail: row.accepted_by_email,
  acceptedByName: row.accepted_by_name,
  acceptedByUserId: row.accepted_by_user_id,
  acceptanceText: row.acceptance_text,
  id: String(row.id),
  termsVersion: row.terms_version,
  userAgent: row.user_agent,
});

export const useTenantContractModuleAcceptance = () => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(currentTenantId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenant_contract_module_acceptances")
        .select("*")
        .eq("tenant_id", currentTenantId as number)
        .eq("terms_version", CONTRACT_MODULE_TERMS_VERSION)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return mapAcceptanceRow(data as ContractModuleAcceptanceRow);
    },
    queryKey: eventosQueryKeys.contractModuleAcceptance(currentTenantId),
  });
};

interface AcceptContractModuleTermsInput {
  acceptedByCpf: string;
  acceptedByName: string;
  acceptanceText?: string;
}

const normalizeCpfDigits = (value: string) => value.replace(/\D/g, "");

export const useAcceptContractModuleTerms = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { profile, user } = useAuth();

  return useMutation({
    mutationFn: async (input: AcceptContractModuleTermsInput) => {
      if (!currentTenantId || !user) {
        throw new Error("Sessão ou tenant atual indisponível.");
      }

      const acceptedByName = input.acceptedByName.trim();
      if (!acceptedByName) {
        throw new Error("Informe o nome de quem está aceitando os termos.");
      }

      const acceptedByCpf = normalizeCpfDigits(input.acceptedByCpf);
      if (acceptedByCpf.length !== 11) {
        throw new Error("Informe um CPF válido com 11 dígitos.");
      }

      const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : null;

      const { data, error } = await supabase
        .from("tenant_contract_module_acceptances")
        .insert({
          accepted_by_cpf: acceptedByCpf,
          accepted_by_email: profile?.email ?? user.email ?? null,
          accepted_by_name: acceptedByName,
          accepted_by_user_id: user.id,
          acceptance_text: input.acceptanceText?.trim() || CONTRACT_MODULE_ACCEPTANCE_DECLARATION,
          tenant_id: currentTenantId,
          terms_version: CONTRACT_MODULE_TERMS_VERSION,
          user_agent: userAgent,
        })
        .select("*")
        .single();

      if (error) throw error;

      return mapAcceptanceRow(data as ContractModuleAcceptanceRow);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: eventosQueryKeys.contractModuleAcceptance(currentTenantId),
      });
    },
  });
};

export const useIsContractModuleEnabled = () => {
  const query = useTenantContractModuleAcceptance();

  return {
    ...query,
    isEnabled: Boolean(query.data),
  };
};
