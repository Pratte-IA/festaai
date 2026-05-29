import { FunnelType } from "./types";

export const eventosQueryKeys = {
  all: (tenantId: number | null) => ["eventos", tenantId] as const,
  detail: (tenantId: number | null, eventoId: number | null) =>
    ["eventos", tenantId, "detail", eventoId] as const,
  list: (tenantId: number | null, funnel?: FunnelType) =>
    ["eventos", tenantId, "list", funnel ?? "todos"] as const,
  notes: (tenantId: number | null, eventoId: number | null) =>
    ["eventos", tenantId, "detail", eventoId, "notas"] as const,
  payments: (tenantId: number | null, eventoId: number | null) =>
    ["eventos", tenantId, "detail", eventoId, "pagamentos"] as const,
  tasks: (tenantId: number | null, eventoId: number | null) =>
    ["eventos", tenantId, "detail", eventoId, "tarefas"] as const,
  closingResponses: (tenantId: number | null, eventoId: number | null) =>
    ["eventos", tenantId, "detail", eventoId, "closing-responses"] as const,
  acceptanceResponses: (tenantId: number | null, eventoId: number | null) =>
    ["eventos", tenantId, "detail", eventoId, "acceptance-responses"] as const,
  contract: (tenantId: number | null, eventoId: number | null) =>
    ["eventos", tenantId, "detail", eventoId, "contract"] as const,
  contractAcceptance: (tenantId: number | null, contractId: string | null) =>
    ["eventos", tenantId, "contract", contractId, "acceptance"] as const,
  contractTemplate: (tenantId: number | null) =>
    ["eventos", tenantId, "contract-template"] as const,
};
