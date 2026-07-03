import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
import { defaultFinancialSettings } from "@/features/configuracoes/financial-settings-types";
import { useCurrentTenant } from "@/features/tenants";
import {
  normalizeBuffetBlock,
  normalizeEquipe,
  normalizePackagePricing,
  PackageData,
  parsePackageItems,
} from "@/data/packagesData";
import { buildPackageAutomationName } from "@/lib/package-automation-name";
import { supabase } from "@/lib/supabase/client";
import { Json } from "@/lib/supabase/database.types";

import {
  buildContract,
  buildContractNumber,
} from "./contracts/contract-builder";
import { parseTenantContractTemplateParams } from "./contracts/contract-template-params";
import {
  CONTRACT_ACCEPTANCE_DECLARATION,
  type AcceptEventoContractInput,
  type EventoContract,
  type EventoContractAcceptance,
  type EventoContractStatus,
  type TenantContractTemplate,
} from "./contracts/contract-types";
import {
  isContractTemplateKey,
  CONTRACT_TEMPLATE_DEFINITIONS,
} from "./contracts/contract-template-types";
import { resolveContractTemplateHtml } from "./contracts/resolve-contract-template-html";
import { fetchTenantContractTemplateRow } from "./contracts/fetch-tenant-contract-template";
import {
  mapAcceptanceRow,
  mapContractRow,
  type AcceptanceRow,
  type ContractRow,
} from "./contracts/contract-mappers";
import { eventosQueryKeys } from "./query-keys";
import { Evento } from "./types";

type PackageRow = {
  active: boolean;
  buffet: unknown;
  description: string;
  duration_minutes: number | null;
  equipe: unknown;
  estrutura: unknown;
  excluded_items: unknown;
  id: number;
  included_guests: number | null;
  included_items: unknown;
  name: string;
  name_automacao: string;
  pricing_tiers: unknown;
  rules: string | null;
  sort_order: number;
};

const mapPackageRow = (row: PackageRow): PackageData => {
  const { schedule, tiers } = normalizePackagePricing(row.pricing_tiers);

  return {
    active: row.active,
    buffet: normalizeBuffetBlock(row.buffet),
    description: row.description ?? "",
    durationMinutes: row.duration_minutes,
    equipe: normalizeEquipe(row.equipe, tiers.map((tier) => tier.id)),
    estrutura: row.estrutura as PackageData["estrutura"],
    excludedItems: parsePackageItems(row.excluded_items),
    id: String(row.id),
    includedGuests: row.included_guests,
    includedItems: parsePackageItems(row.included_items),
    name: row.name,
    nameAutomacao: row.name_automacao?.trim() || buildPackageAutomationName(row.name),
    pricingSchedule: schedule,
    pricingTiers: tiers,
    rules: row.rules,
    sortOrder: row.sort_order,
  };
};

type TemplateRow = {
  description: string | null;
  id: number;
  is_active: boolean;
  is_default: boolean;
  name: string;
  template_html: string;
  template_key: string | null;
  version: number;
};

const mapTemplateRow = (row: TemplateRow): TenantContractTemplate => {
  const templateKey =
    row.template_key && isContractTemplateKey(row.template_key) ? row.template_key : null;
  const baseHtml =
    templateKey != null ? CONTRACT_TEMPLATE_DEFINITIONS[templateKey].placeholderHtml : row.template_html;

  return {
    description: row.description,
    id: String(row.id),
    isActive: row.is_active,
    isDefault: row.is_default,
    name: row.name,
    templateHtml: resolveContractTemplateHtml(row.template_html, baseHtml),
    templateKey,
    version: row.version,
  };
};

export const useTenantDefaultContractTemplate = () => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(currentTenantId),
    queryFn: async (): Promise<TenantContractTemplate | null> => {
      const data = await fetchTenantContractTemplateRow(currentTenantId as number);
      return data ? mapTemplateRow(data) : null;
    },
    queryKey: eventosQueryKeys.contractTemplate(currentTenantId),
  });
};

export const useEventoContract = (eventoId: number | null) => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(currentTenantId && eventoId),
    queryFn: async (): Promise<EventoContract | null> => {
      const { data, error } = await supabase
        .from("evento_contracts")
        .select("*")
        .eq("tenant_id", currentTenantId as number)
        .eq("evento_id", eventoId as number)
        .in("status", ["generated", "accepted"])
        .order("generated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data ? mapContractRow(data as ContractRow) : null;
    },
    queryKey: eventosQueryKeys.contract(currentTenantId, eventoId),
  });
};

export const useEventoContractAcceptance = (contractId: string | null) => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(currentTenantId && contractId),
    queryFn: async (): Promise<EventoContractAcceptance | null> => {
      const { data, error } = await supabase
        .from("evento_contract_acceptances")
        .select("*")
        .eq("tenant_id", currentTenantId as number)
        .eq("contract_id", Number(contractId))
        .maybeSingle();

      if (error) throw error;
      return data ? mapAcceptanceRow(data as AcceptanceRow) : null;
    },
    queryKey: eventosQueryKeys.contractAcceptance(currentTenantId, contractId),
  });
};

export const useGenerateEventoContract = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (evento: Evento): Promise<EventoContract> => {
      if (!currentTenantId || !user) throw new Error("Sessao ou tenant atual indisponivel.");

      const [
        templateRow,
        closingFieldsResult,
        closingResponsesResult,
        acceptanceTermsResult,
        acceptanceResponsesResult,
        financialResult,
        existingContractsResult,
        pendingGeneratedResult,
        companyProfileResult,
        moduleSettingsResult,
      ] = await Promise.all([
        fetchTenantContractTemplateRow(currentTenantId, { packageId: evento.pacote_id }),
        supabase
          .from("tenant_closing_form_fields")
          .select("*")
          .eq("tenant_id", currentTenantId),
        supabase
          .from("evento_closing_responses")
          .select("field_id, value")
          .eq("tenant_id", currentTenantId)
          .eq("evento_id", evento.id),
        supabase
          .from("tenant_acceptance_terms")
          .select("*")
          .eq("tenant_id", currentTenantId)
          .eq("active", true)
          .order("sort_order", { ascending: true }),
        supabase
          .from("evento_acceptance_responses")
          .select("term_id, accepted")
          .eq("tenant_id", currentTenantId)
          .eq("evento_id", evento.id),
        supabase
          .from("tenant_financial_settings")
          .select("*")
          .eq("tenant_id", currentTenantId)
          .maybeSingle(),
        supabase
          .from("evento_contracts")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", currentTenantId)
          .eq("evento_id", evento.id),
        supabase
          .from("evento_contracts")
          .select("id, status")
          .eq("tenant_id", currentTenantId)
          .eq("evento_id", evento.id)
          .eq("status", "generated")
          .maybeSingle(),
        supabase
          .from("tenant_company_profiles")
          .select(
            "tenant_id, company_name, cnpj, address_cep, address_street, address_number, address_complement, address_neighborhood, address_city, address_state, legal_representative_name, legal_representative_cpf, completed_at",
          )
          .eq("tenant_id", currentTenantId)
          .maybeSingle(),
        supabase
          .from("tenant_contract_module_settings")
          .select("template_params")
          .eq("tenant_id", currentTenantId)
          .maybeSingle(),
      ]);

      if (!templateRow) {
        throw new Error("Nenhum modelo de contrato padrao encontrado para este espaco.");
      }

      const acceptedContract = await supabase
        .from("evento_contracts")
        .select("id")
        .eq("tenant_id", currentTenantId)
        .eq("evento_id", evento.id)
        .eq("status", "accepted")
        .maybeSingle();

      if (acceptedContract.error) throw acceptedContract.error;
      if (acceptedContract.data) {
        throw new Error("Ja existe um contrato aceito para esta festa.");
      }

      if (pendingGeneratedResult.error) throw pendingGeneratedResult.error;
      if (pendingGeneratedResult.data) {
        const { error: cancelError } = await supabase
          .from("evento_contracts")
          .update({ status: "cancelled", updated_by: user.id })
          .eq("tenant_id", currentTenantId)
          .eq("id", pendingGeneratedResult.data.id);

        if (cancelError) throw cancelError;
      }

      let packageData = null;
      if (evento.pacote_id) {
        const { data: packageRow, error: packageError } = await supabase
          .from("tenant_packages")
          .select("*")
          .eq("tenant_id", currentTenantId)
          .eq("id", evento.pacote_id)
          .maybeSingle();

        if (packageError) throw packageError;
        if (packageRow) packageData = mapPackageRow(packageRow);
      }

      const closingResponses: Record<string, string> = {};
      (closingResponsesResult.data ?? []).forEach((row) => {
        closingResponses[String(row.field_id)] = row.value ?? "";
      });

      const acceptanceResponses: Record<string, boolean> = {};
      (acceptanceResponsesResult.data ?? []).forEach((row) => {
        acceptanceResponses[String(row.term_id)] = row.accepted;
      });

      const financialSettings = {
        ...defaultFinancialSettings,
        cancellation_policy: financialResult.data?.cancellation_policy ?? defaultFinancialSettings.cancellation_policy,
        rescheduling_policy: financialResult.data?.rescheduling_policy ?? defaultFinancialSettings.rescheduling_policy,
      };

      const sequence = (existingContractsResult.count ?? 0) + 1;
      const contractNumber = buildContractNumber(currentTenantId, evento.id, sequence);
      const template = mapTemplateRow(templateRow);

      const built = await buildContract({
        acceptanceResponses,
        acceptanceTerms: (acceptanceTermsResult.data ?? []).map((row) => ({
          active: row.active,
          appearsInContract: row.appears_in_contract,
          content: row.content,
          createdAt: row.created_at,
          id: String(row.id),
          isRequired: row.is_required,
          isSystem: row.is_system,
          showAtSigning: row.show_at_signing ?? false,
          showInForm: row.show_in_form ?? true,
          sortOrder: row.sort_order,
          termKey: row.term_key,
          title: row.title,
          updatedAt: row.updated_at,
        })),
        closingFields: (closingFieldsResult.data ?? []).map((row) => ({
          active: row.active,
          category: row.category as never,
          config: (row.config ?? {}) as Record<string, unknown>,
          description: row.description,
          fieldKey: row.field_key,
          fieldType: row.field_type as never,
          id: String(row.id),
          isLocked: row.is_locked ?? false,
          isSystem: row.is_system ?? false,
          label: row.label,
          required: row.required,
          section: row.section as never,
          sortOrder: row.sort_order,
          usage: {
            ai: row.usage_ai ?? false,
            checklist: row.usage_checklist ?? false,
            contract: row.usage_contract ?? false,
            internalTask: row.usage_internal_task ?? false,
            partySummary: row.usage_party_summary ?? false,
            reports: row.usage_reports ?? false,
          },
        })),
        closingResponses,
        companyProfile: companyProfileResult.data
          ? {
              addressCity: companyProfileResult.data.address_city,
              addressComplement: companyProfileResult.data.address_complement,
              addressNeighborhood: companyProfileResult.data.address_neighborhood,
              addressNumber: companyProfileResult.data.address_number,
              addressState: companyProfileResult.data.address_state,
              addressStreet: companyProfileResult.data.address_street,
              addressCep: companyProfileResult.data.address_cep,
              cnpj: companyProfileResult.data.cnpj,
              companyName: companyProfileResult.data.company_name,
              completedAt: companyProfileResult.data.completed_at,
              legalRepresentativeCpf: companyProfileResult.data.legal_representative_cpf,
              legalRepresentativeName: companyProfileResult.data.legal_representative_name,
              tenantId: companyProfileResult.data.tenant_id,
            }
          : null,
        contractNumber,
        evento,
        financialSettings,
        packageData,
        templateHtml: template.templateHtml,
        templateKey: template.templateKey,
        templateParams: parseTenantContractTemplateParams(
          moduleSettingsResult.data?.template_params,
        ),
      });

      const { data, error } = await supabase
        .from("evento_contracts")
        .insert({
          contract_hash: built.contractHash,
          contract_html: built.contractHtml,
          contract_number: contractNumber,
          contract_snapshot: built.contractSnapshot as unknown as Json,
          contract_text: built.contractText,
          created_by: user.id,
          evento_id: evento.id,
          generated_at: new Date().toISOString(),
          status: "generated",
          template_id: Number(template.id),
          template_version: template.version,
          tenant_id: currentTenantId,
          updated_by: user.id,
        })
        .select("*")
        .single();

      if (error) throw error;
      return mapContractRow(data as ContractRow);
    },
    onSuccess: (contract, evento) => {
      void queryClient.invalidateQueries({
        queryKey: eventosQueryKeys.contract(currentTenantId, evento.id),
      });
      void queryClient.invalidateQueries({
        queryKey: eventosQueryKeys.contractsList(currentTenantId),
      });
      void queryClient.invalidateQueries({
        queryKey: eventosQueryKeys.contractById(currentTenantId, Number(contract.id)),
      });
      void queryClient.invalidateQueries({
        queryKey: eventosQueryKeys.contractHistory(currentTenantId, evento.id),
      });
    },
  });
};

export const useAcceptEventoContract = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: AcceptEventoContractInput) => {
      if (!currentTenantId || !user) throw new Error("Sessao ou tenant atual indisponivel.");

      const { data: contract, error: contractError } = await supabase
        .from("evento_contracts")
        .select("*")
        .eq("tenant_id", currentTenantId)
        .eq("id", Number(input.contractId))
        .eq("evento_id", input.eventoId)
        .maybeSingle();

      if (contractError) throw contractError;
      if (!contract) throw new Error("Contrato nao encontrado.");
      if (contract.status !== "generated") {
        throw new Error("Somente contratos aguardando aceite podem ser confirmados.");
      }

      const { data: terms, error: termsError } = await supabase
        .from("tenant_acceptance_terms")
        .select("id, title, content, is_required, appears_in_contract, active, show_at_signing")
        .eq("tenant_id", currentTenantId)
        .eq("active", true)
        .eq("show_at_signing", true);

      if (termsError) throw termsError;

      const acceptedTermsSnapshot = (terms ?? []).map((term) => {
        const response = input.termAcceptances.find((item) => item.termId === term.id);
        return {
          accepted: response?.accepted ?? false,
          content: term.content,
          termId: term.id,
          title: term.title,
        };
      });

      const requiredMissing = (terms ?? []).filter(
        (term) => term.is_required && !acceptedTermsSnapshot.find((t) => t.termId === term.id)?.accepted,
      );
      if (requiredMissing.length > 0) {
        throw new Error("Aceite todos os termos obrigatorios antes de confirmar o contrato.");
      }

      const acceptedAt = new Date().toISOString();
      const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : null;

      const { error: acceptanceError } = await supabase.from("evento_contract_acceptances").insert({
        accepted_at: acceptedAt,
        accepted_by_cpf: input.acceptedByCpf?.trim() || null,
        accepted_by_email: input.acceptedByEmail?.trim() || null,
        accepted_by_name: input.acceptedByName.trim(),
        accepted_by_phone: input.acceptedByPhone?.trim() || null,
        accepted_terms_snapshot: acceptedTermsSnapshot as unknown as Json,
        acceptance_text: input.acceptanceText.trim() || CONTRACT_ACCEPTANCE_DECLARATION,
        contract_id: Number(input.contractId),
        created_by: user.id,
        evento_id: input.eventoId,
        metadata: { source: "internal_ui" } as unknown as Json,
        tenant_id: currentTenantId,
        user_agent: userAgent,
      });

      if (acceptanceError) throw acceptanceError;

      const { error: updateError } = await supabase
        .from("evento_contracts")
        .update({
          accepted_at: acceptedAt,
          status: "accepted",
          updated_by: user.id,
        })
        .eq("tenant_id", currentTenantId)
        .eq("id", Number(input.contractId));

      if (updateError) throw updateError;
    },
    onSuccess: (_result, input) => {
      void queryClient.invalidateQueries({
        queryKey: eventosQueryKeys.contract(currentTenantId, input.eventoId),
      });
      void queryClient.invalidateQueries({
        queryKey: eventosQueryKeys.contractAcceptance(currentTenantId, input.contractId),
      });
      void queryClient.invalidateQueries({
        queryKey: eventosQueryKeys.contractsList(currentTenantId),
      });
      void queryClient.invalidateQueries({
        queryKey: eventosQueryKeys.contractById(currentTenantId, Number(input.contractId)),
      });
      void queryClient.invalidateQueries({
        queryKey: eventosQueryKeys.contractHistory(currentTenantId, input.eventoId),
      });
    },
  });
};
