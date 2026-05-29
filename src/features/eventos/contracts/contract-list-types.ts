import type { EventoContract, EventoContractStatus } from "./contract-types";

export interface ContractEventSummary {
  aniversarianteNome: string | null;
  clienteNome: string;
  dataEvento: string | null;
  id: number;
  pacoteNome: string | null;
  valorTotal: number | null;
}

export interface TenantContractListItem extends EventoContract {
  acceptedByName: string | null;
  evento: ContractEventSummary | null;
}

export interface TenantContractMetrics {
  accepted: number;
  cancelledOrSuperseded: number;
  pending: number;
  total: number;
}

export type ContractStatusFilter = EventoContractStatus | "all";

export type ContractAcceptedFilter = "all" | "accepted" | "pending";
