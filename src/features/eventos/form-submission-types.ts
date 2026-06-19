import type { EventoContractStatus } from "./contracts/contract-types";

export interface TenantFormSubmissionListItem {
  aniversarianteNome: string | null;
  clienteNome: string;
  contractId: number | null;
  contractNumber: string | null;
  contractStatus: EventoContractStatus | null;
  dataEvento: string | null;
  eventoId: number;
  fechamentoConfirmadoEm: string | null;
  pacoteNome: string | null;
  submittedAt: string;
  valorTotal: number | null;
}
