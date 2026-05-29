import { useQuery } from "@tanstack/react-query";

import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

import {
  mapAcceptanceRow,
  mapContractRow,
  type AcceptanceRow,
  type ContractRow,
} from "./contracts/contract-mappers";
import type { ContractEventSummary, TenantContractListItem } from "./contracts/contract-list-types";
import type { EventoContract } from "./contracts/contract-types";
import { eventosQueryKeys } from "./query-keys";

type EventoSummaryRow = {
  aniversariante_nome: string | null;
  cliente_nome: string;
  data_evento: string | null;
  id: number;
  pacote_nome: string | null;
  valor_total: number | null;
};

const snapshotString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value : null;

const snapshotNumber = (value: unknown): number | null =>
  typeof value === "number" && !Number.isNaN(value) ? value : null;

const buildEventSummaryFromSnapshot = (
  contract: EventoContract,
): ContractEventSummary => {
  const snap = contract.contractSnapshot.evento as Record<string, unknown>;

  return {
    aniversarianteNome: snapshotString(snap.aniversariante_nome),
    clienteNome: snapshotString(snap.cliente_nome) ?? "—",
    dataEvento: snapshotString(snap.data_evento),
    id: Number(contract.eventoId),
    pacoteNome: snapshotString(snap.pacote_nome) ?? contract.contractSnapshot.package?.name ?? null,
    valorTotal: snapshotNumber(snap.valor_total),
  };
};

const mapEventSummaryRow = (row: EventoSummaryRow): ContractEventSummary => ({
  aniversarianteNome: row.aniversariante_nome,
  clienteNome: row.cliente_nome,
  dataEvento: row.data_evento,
  id: row.id,
  pacoteNome: row.pacote_nome,
  valorTotal: row.valor_total,
});

const enrichContracts = (
  contracts: EventoContract[],
  eventosById: Map<number, ContractEventSummary>,
  acceptanceByContractId: Map<number, string>,
): TenantContractListItem[] =>
  contracts.map((contract) => {
    const eventoId = Number(contract.eventoId);
    const evento = eventosById.get(eventoId) ?? buildEventSummaryFromSnapshot(contract);

    return {
      ...contract,
      acceptedByName: acceptanceByContractId.get(Number(contract.id)) ?? null,
      evento,
    };
  });

const fetchTenantContracts = async (tenantId: number): Promise<TenantContractListItem[]> => {
  const { data: contractRows, error: contractsError } = await supabase
    .from("evento_contracts")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("generated_at", { ascending: false });

  if (contractsError) throw contractsError;

  const contracts = (contractRows ?? []).map((row) => mapContractRow(row as ContractRow));
  if (contracts.length === 0) return [];

  const eventoIds = [...new Set(contracts.map((contract) => Number(contract.eventoId)))];
  const contractIds = contracts.map((contract) => Number(contract.id));

  const [eventosResult, acceptancesResult] = await Promise.all([
    supabase
      .from("eventos")
      .select("id, cliente_nome, aniversariante_nome, data_evento, valor_total, pacote_nome")
      .eq("tenant_id", tenantId)
      .in("id", eventoIds),
    supabase
      .from("evento_contract_acceptances")
      .select("contract_id, accepted_by_name")
      .eq("tenant_id", tenantId)
      .in("contract_id", contractIds),
  ]);

  if (eventosResult.error) throw eventosResult.error;
  if (acceptancesResult.error) throw acceptancesResult.error;

  const eventosById = new Map<number, ContractEventSummary>(
    (eventosResult.data ?? []).map((row) => [
      row.id,
      mapEventSummaryRow(row as EventoSummaryRow),
    ]),
  );

  const acceptanceByContractId = new Map<number, string>(
    (acceptancesResult.data ?? []).map((row) => [row.contract_id, row.accepted_by_name]),
  );

  return enrichContracts(contracts, eventosById, acceptanceByContractId);
};

export const useTenantContracts = () => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(currentTenantId),
    queryFn: () => fetchTenantContracts(currentTenantId as number),
    queryKey: eventosQueryKeys.contractsList(currentTenantId),
  });
};

export const useContractById = (contractId: number | null) => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(currentTenantId && contractId),
    queryFn: async (): Promise<EventoContract | null> => {
      const { data, error } = await supabase
        .from("evento_contracts")
        .select("*")
        .eq("tenant_id", currentTenantId as number)
        .eq("id", contractId as number)
        .maybeSingle();

      if (error) throw error;
      return data ? mapContractRow(data as ContractRow) : null;
    },
    queryKey: eventosQueryKeys.contractById(currentTenantId, contractId),
  });
};

export const useEventoContractHistory = (eventoId: number | null) => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(currentTenantId && eventoId),
    queryFn: async (): Promise<EventoContract[]> => {
      const { data, error } = await supabase
        .from("evento_contracts")
        .select("*")
        .eq("tenant_id", currentTenantId as number)
        .eq("evento_id", eventoId as number)
        .order("generated_at", { ascending: false });

      if (error) throw error;
      return (data ?? []).map((row) => mapContractRow(row as ContractRow));
    },
    queryKey: eventosQueryKeys.contractHistory(currentTenantId, eventoId),
  });
};

export const useContractAcceptance = (contractId: string | null) => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(currentTenantId && contractId),
    queryFn: async () => {
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
