import { useQuery } from "@tanstack/react-query";

import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

import type { EventoContractStatus } from "./contracts/contract-types";
import type { TenantFormSubmissionListItem } from "./form-submission-types";
import { eventosQueryKeys } from "./query-keys";

type EventoSummaryRow = {
  aniversariante_nome: string | null;
  cliente_nome: string;
  data_evento: string | null;
  fechamento_confirmado_em: string | null;
  id: number;
  pacote_nome: string | null;
  valor_total: number | null;
};

interface SubmissionAccumulator {
  contractId: number | null;
  contractNumber: string | null;
  contractStatus: EventoContractStatus | null;
  submittedAt: string;
}

const pickLatestTimestamp = (current: string, candidate: string | null | undefined) => {
  if (!candidate) return current;
  return new Date(candidate).getTime() > new Date(current).getTime() ? candidate : current;
};

const fetchTenantFormSubmissions = async (
  tenantId: number,
): Promise<TenantFormSubmissionListItem[]> => {
  const [closingResult, acceptanceResult, contractsResult] = await Promise.all([
    supabase
      .from("evento_closing_responses")
      .select("evento_id, updated_at")
      .eq("tenant_id", tenantId)
      .is("created_by", null),
    supabase
      .from("evento_acceptance_responses")
      .select("evento_id, accepted_at, updated_at")
      .eq("tenant_id", tenantId)
      .is("created_by", null),
    supabase
      .from("evento_contracts")
      .select("evento_id, generated_at, status, id, contract_number")
      .eq("tenant_id", tenantId)
      .is("created_by", null)
      .order("generated_at", { ascending: false }),
  ]);

  if (closingResult.error) throw closingResult.error;
  if (acceptanceResult.error) throw acceptanceResult.error;
  if (contractsResult.error) throw contractsResult.error;

  const byEvento = new Map<number, SubmissionAccumulator>();

  (closingResult.data ?? []).forEach((row) => {
    const existing = byEvento.get(row.evento_id);
    const submittedAt = row.updated_at;

    if (!existing) {
      byEvento.set(row.evento_id, {
        contractId: null,
        contractNumber: null,
        contractStatus: null,
        submittedAt,
      });
      return;
    }

    existing.submittedAt = pickLatestTimestamp(existing.submittedAt, submittedAt);
  });

  (acceptanceResult.data ?? []).forEach((row) => {
    const timestamp = row.accepted_at ?? row.updated_at;
    const existing = byEvento.get(row.evento_id);

    if (!existing) {
      byEvento.set(row.evento_id, {
        contractId: null,
        contractNumber: null,
        contractStatus: null,
        submittedAt: timestamp,
      });
      return;
    }

    existing.submittedAt = pickLatestTimestamp(existing.submittedAt, timestamp);
  });

  (contractsResult.data ?? []).forEach((row) => {
    const existing = byEvento.get(row.evento_id);

    if (!existing) {
      byEvento.set(row.evento_id, {
        contractId: row.id,
        contractNumber: row.contract_number,
        contractStatus: row.status as EventoContractStatus,
        submittedAt: row.generated_at,
      });
      return;
    }

    existing.submittedAt = pickLatestTimestamp(existing.submittedAt, row.generated_at);

    if (!existing.contractId) {
      existing.contractId = row.id;
      existing.contractNumber = row.contract_number;
      existing.contractStatus = row.status as EventoContractStatus;
    }
  });

  const eventoIds = [...byEvento.keys()];
  if (eventoIds.length === 0) return [];

  const { data: eventos, error: eventosError } = await supabase
    .from("eventos")
    .select(
      "id, cliente_nome, aniversariante_nome, data_evento, valor_total, pacote_nome, fechamento_confirmado_em",
    )
    .eq("tenant_id", tenantId)
    .in("id", eventoIds);

  if (eventosError) throw eventosError;

  return (eventos ?? [])
    .map((row) => {
      const summary = row as EventoSummaryRow;
      const submission = byEvento.get(summary.id);
      if (!submission) return null;

      return {
        aniversarianteNome: summary.aniversariante_nome,
        clienteNome: summary.cliente_nome,
        contractId: submission.contractId,
        contractNumber: submission.contractNumber,
        contractStatus: submission.contractStatus,
        dataEvento: summary.data_evento,
        eventoId: summary.id,
        fechamentoConfirmadoEm: summary.fechamento_confirmado_em,
        pacoteNome: summary.pacote_nome,
        submittedAt: submission.submittedAt,
        valorTotal: summary.valor_total,
      } satisfies TenantFormSubmissionListItem;
    })
    .filter((item): item is TenantFormSubmissionListItem => item !== null)
    .sort(
      (left, right) =>
        new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime(),
    );
};

export const useTenantFormSubmissions = () => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(currentTenantId),
    queryFn: () => fetchTenantFormSubmissions(currentTenantId as number),
    queryKey: eventosQueryKeys.formSubmissionsList(currentTenantId),
  });
};
