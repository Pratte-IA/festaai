import { Json } from "@/lib/supabase/database.types";

import type {
  EventoContract,
  EventoContractAcceptance,
  EventoContractStatus,
} from "./contract-types";

export type ContractRow = {
  accepted_at: string | null;
  contract_hash: string;
  contract_html: string;
  contract_number: string;
  contract_snapshot: Json;
  contract_text: string | null;
  evento_id: number;
  generated_at: string;
  id: number;
  status: EventoContractStatus;
  superseded_by: number | null;
  template_id: number;
  template_version: number;
};

export type AcceptanceRow = {
  accepted_at: string;
  accepted_by_cpf: string | null;
  accepted_by_email: string | null;
  accepted_by_name: string;
  accepted_by_phone: string | null;
  accepted_terms_snapshot: Json;
  acceptance_text: string;
  contract_id: number;
  id: number;
  metadata: Json;
  user_agent: string | null;
};

export const mapContractRow = (row: ContractRow): EventoContract => ({
  acceptedAt: row.accepted_at,
  contractHash: row.contract_hash,
  contractHtml: row.contract_html,
  contractNumber: row.contract_number,
  contractSnapshot: row.contract_snapshot as EventoContract["contractSnapshot"],
  contractText: row.contract_text,
  eventoId: String(row.evento_id),
  generatedAt: row.generated_at,
  id: String(row.id),
  status: row.status,
  supersededBy: row.superseded_by != null ? String(row.superseded_by) : null,
  templateId: String(row.template_id),
  templateVersion: row.template_version,
});

export const mapAcceptanceRow = (row: AcceptanceRow): EventoContractAcceptance => ({
  acceptedAt: row.accepted_at,
  acceptedByCpf: row.accepted_by_cpf,
  acceptedByEmail: row.accepted_by_email,
  acceptedByName: row.accepted_by_name,
  acceptedByPhone: row.accepted_by_phone,
  acceptedTermsSnapshot: (row.accepted_terms_snapshot ??
    []) as EventoContractAcceptance["acceptedTermsSnapshot"],
  acceptanceText: row.acceptance_text,
  contractId: String(row.contract_id),
  id: String(row.id),
  metadata: (row.metadata ?? {}) as Record<string, unknown>,
  userAgent: row.user_agent,
});
