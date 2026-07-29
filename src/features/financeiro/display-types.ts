export interface FinanceiroContratoEntrada {
  /**
   * Data de referência da entrada.
   * Para legado (valor_entrada): estimada (fechamento_confirmado_em ?? created_at) — nunca tratar como data real sem isLegacyEstimate.
   */
  referenceAt: string;
  clienteNome: string;
  contractId: number | null;
  /** @deprecated Use isLegacyEstimate */
  estimatedDate?: boolean;
  eventoId: number;
  id: number;
  /** true quando a data não é comprovação de recebimento real */
  isLegacyEstimate?: boolean;
  valorEntrada: number;
}

export interface FinanceiroDisplayItem {
  categoria: string;
  data_lancamento: string;
  deletable: boolean;
  descricao: string | null;
  evento_id: number | null;
  id: string;
  isLegacyEstimate?: boolean;
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

export type DreStatementLineKind =
  | "deduction"
  | "expense"
  | "header"
  | "revenue"
  | "subtotal"
  | "total";

export interface DreStatementLine {
  id: string;
  kind: DreStatementLineKind;
  label: string;
  level: 0 | 1;
  value: number;
}

export interface DreStatement {
  adicionaisTotal: number;
  descontosTotal: number;
  despesasTotal: number;
  lines: DreStatementLine[];
  outrasReceitasTotal: number;
  pagamentosSaldoTotal: number;
  receitaBruta: number;
  receitaLiquida: number;
  reservasTotal: number;
  resultadoLiquido: number;
}
