import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase/client";

import { comercialQueryKeys } from "./query-keys";
import { AdminContractAcceptanceRow } from "./types";

export const useAdminContractAcceptances = () =>
  useQuery({
    queryFn: async () => {
      const { data, error } = await supabase
        .from("billing_contract_acceptances")
        .select(
          `
          id,
          accepted_at,
          accepted_by_name,
          accepted_by_email,
          accepted_by_company,
          accepted_by_cpf_cnpj,
          contract_version,
          external_reference,
          ip_address,
          user_agent,
          billing_subscription_id,
          billing_subscriptions (
            status,
            tenant_id,
            tenants ( name )
          )
        `,
        )
        .order("accepted_at", { ascending: false });

      if (error) throw error;

      return (data ?? []).map((row) => {
        const subscription = Array.isArray(row.billing_subscriptions)
          ? row.billing_subscriptions[0]
          : row.billing_subscriptions;
        const tenant = subscription?.tenants
          ? Array.isArray(subscription.tenants)
            ? subscription.tenants[0]
            : subscription.tenants
          : null;

        return {
          accepted_at: row.accepted_at,
          accepted_by_company: row.accepted_by_company,
          accepted_by_cpf_cnpj: row.accepted_by_cpf_cnpj,
          accepted_by_email: row.accepted_by_email,
          accepted_by_name: row.accepted_by_name,
          billing_subscription_id: row.billing_subscription_id,
          contract_version: row.contract_version,
          external_reference: row.external_reference,
          id: row.id,
          ip_address: row.ip_address ? String(row.ip_address) : null,
          subscription_status: subscription?.status ?? null,
          tenant_id: subscription?.tenant_id ?? null,
          tenant_name: tenant?.name ?? null,
          user_agent: row.user_agent,
        } satisfies AdminContractAcceptanceRow;
      });
    },
    queryKey: comercialQueryKeys.adminContractAcceptances(),
  });

export const useAdminContractAcceptanceDetail = (id: number | null) =>
  useQuery({
    enabled: id != null && id > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("billing_contract_acceptances")
        .select("*")
        .eq("id", id as number)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Aceite contratual não encontrado.");
      return data;
    },
    queryKey: comercialQueryKeys.adminContractAcceptance(id ?? 0),
  });
