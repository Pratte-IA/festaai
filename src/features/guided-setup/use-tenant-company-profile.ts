import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
import { useCurrentTenant } from "@/features/tenants";
import { onlyDigits } from "@/lib/brazil-documents";
import { supabase } from "@/lib/supabase/client";

import { guidedSetupQueryKeys } from "./query-keys";
import type { TenantCompanyProfile, TenantCompanyProfileInput } from "./types";

type CompanyProfileRow = {
  address_city: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_number: string | null;
  address_state: string | null;
  address_street: string | null;
  address_cep: string | null;
  cnpj: string | null;
  company_name: string | null;
  completed_at: string | null;
  legal_representative_cpf: string | null;
  legal_representative_name: string | null;
  tenant_id: number;
};

const mapCompanyProfileRow = (row: CompanyProfileRow): TenantCompanyProfile => ({
  addressCity: row.address_city,
  addressComplement: row.address_complement,
  addressNeighborhood: row.address_neighborhood,
  addressNumber: row.address_number,
  addressState: row.address_state,
  addressStreet: row.address_street,
  addressCep: row.address_cep,
  cnpj: row.cnpj,
  companyName: row.company_name,
  completedAt: row.completed_at,
  legalRepresentativeCpf: row.legal_representative_cpf,
  legalRepresentativeName: row.legal_representative_name,
  tenantId: row.tenant_id,
});

export const useTenantCompanyProfile = () => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(currentTenantId),
    queryFn: async (): Promise<TenantCompanyProfile | null> => {
      const { data, error } = await supabase
        .from("tenant_company_profiles")
        .select(
          "tenant_id, company_name, cnpj, address_cep, address_street, address_number, address_complement, address_neighborhood, address_city, address_state, legal_representative_name, legal_representative_cpf, completed_at",
        )
        .eq("tenant_id", currentTenantId as number)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return mapCompanyProfileRow(data as CompanyProfileRow);
    },
    queryKey: guidedSetupQueryKeys.companyProfile(currentTenantId),
  });
};

export const useSaveTenantCompanyProfile = () => {
  const queryClient = useQueryClient();
  const { currentTenant, currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: TenantCompanyProfileInput) => {
      if (!currentTenantId || !user) {
        throw new Error("Sessão ou tenant atual indisponível.");
      }

      const now = new Date().toISOString();
      const normalized = {
        address_city: input.addressCity.trim(),
        address_complement: input.addressComplement?.trim() || null,
        address_neighborhood: input.addressNeighborhood.trim(),
        address_number: input.addressNumber.trim(),
        address_state: input.addressState.trim(),
        address_street: input.addressStreet.trim(),
        address_cep: onlyDigits(input.addressCep),
        cnpj: onlyDigits(input.cnpj),
        company_name: input.companyName.trim(),
        completed_at: now,
        legal_representative_cpf: onlyDigits(input.legalRepresentativeCpf),
        legal_representative_name: input.legalRepresentativeName.trim(),
        tenant_id: currentTenantId,
        updated_by: user.id,
      };

      const { data: existing, error: existingError } = await supabase
        .from("tenant_company_profiles")
        .select("tenant_id")
        .eq("tenant_id", currentTenantId)
        .maybeSingle();

      if (existingError) throw existingError;

      const { data, error } = existing
        ? await supabase
            .from("tenant_company_profiles")
            .update(normalized)
            .eq("tenant_id", currentTenantId)
            .select(
              "tenant_id, company_name, cnpj, address_cep, address_street, address_number, address_complement, address_neighborhood, address_city, address_state, legal_representative_name, legal_representative_cpf, completed_at",
            )
            .single()
        : await supabase
            .from("tenant_company_profiles")
            .insert({ ...normalized, created_by: user.id })
            .select(
              "tenant_id, company_name, cnpj, address_cep, address_street, address_number, address_complement, address_neighborhood, address_city, address_state, legal_representative_name, legal_representative_cpf, completed_at",
            )
            .single();

      if (error) throw error;

      const { error: tenantError } = await supabase
        .from("tenants")
        .update({
          document: onlyDigits(input.cnpj),
          name: input.companyName.trim(),
        })
        .eq("id", currentTenantId);

      if (tenantError) throw tenantError;

      if (currentTenant?.name !== input.companyName.trim()) {
        void queryClient.invalidateQueries({ queryKey: ["tenants"] });
      }

      return mapCompanyProfileRow(data as CompanyProfileRow);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: guidedSetupQueryKeys.companyProfile(currentTenantId),
      });
      void queryClient.invalidateQueries({
        queryKey: guidedSetupQueryKeys.derived(currentTenantId),
      });
    },
  });
};
