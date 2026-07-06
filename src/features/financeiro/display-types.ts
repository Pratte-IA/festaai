export interface FinanceiroContratoEntrada {
  acceptedAt: string;
  clienteNome: string;
  contractId: number;
  eventoId: number;
  id: number;
  valorEntrada: number;
}

export interface FinanceiroDisplayItem {
  categoria: string;
  data_lancamento: string;
  deletable: boolean;
  descricao: string | null;
  evento_id: number | null;
  id: string;
  ledgerId?: number;
  origem: string;
  tipo: "entrada" | "saida";
  valor: number;
}

export interface DrePeriodSummary {
  entradas: number;
  resultado: number;
  saidas: number;
}
