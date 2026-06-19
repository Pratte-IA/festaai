import type { ContractTemplateKey } from "./contract-template-types";

export type EventoContractStatus =
  | "accepted"
  | "cancelled"
  | "draft"
  | "generated"
  | "superseded";

export interface TenantContractTemplate {
  description: string | null;
  id: string;
  isActive: boolean;
  isDefault: boolean;
  name: string;
  templateHtml: string;
  templateKey: ContractTemplateKey | null;
  version: number;
}

export interface ContractSnapshotTerm {
  accepted: boolean;
  content: string;
  termId: number;
  title: string;
}

export interface ContractSnapshotAdditional {
  category: string;
  id: number;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  type: string;
}

export interface ContractSnapshot {
  aceites: ContractSnapshotTerm[];
  adicionais: ContractSnapshotAdditional[];
  customFields: Record<string, string>;
  evento: Record<string, unknown>;
  financial: {
    cancellationPolicy: string | null;
    reschedulingPolicy: string | null;
  };
  generatedAt: string;
  package: {
    includedGuests: number | null;
    includedItems: string[];
    excludedItems: string[];
    name: string | null;
  } | null;
}

export interface EventoContract {
  acceptedAt: string | null;
  contractHash: string;
  contractHtml: string;
  contractNumber: string;
  contractSnapshot: ContractSnapshot;
  contractText: string | null;
  eventoId: string;
  generatedAt: string;
  id: string;
  status: EventoContractStatus;
  supersededBy: string | null;
  templateId: string;
  templateVersion: number;
}

export interface EventoContractAcceptance {
  acceptedAt: string;
  acceptedByCpf: string | null;
  acceptedByEmail: string | null;
  acceptedByName: string;
  acceptedByPhone: string | null;
  acceptedTermsSnapshot: ContractSnapshotTerm[];
  acceptanceText: string;
  contractId: string;
  id: string;
  metadata: Record<string, unknown>;
  userAgent: string | null;
}

export interface AcceptEventoContractInput {
  acceptedByCpf?: string;
  acceptedByEmail?: string;
  acceptedByName: string;
  acceptedByPhone?: string;
  acceptanceText: string;
  contractId: string;
  eventoId: number;
  termAcceptances: Array<{ accepted: boolean; termId: number }>;
}

export const CONTRACT_ACCEPTANCE_DECLARATION =
  "Declaro que li, compreendi e aceito as condições deste contrato, incluindo valores, forma de pagamento, data, horário, pacote contratado, política de cancelamento, política de remarcação e regras de uso do espaço.";

export const EMPTY_PLACEHOLDER = "—";
