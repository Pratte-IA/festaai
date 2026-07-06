import { Tables, TablesInsert, TablesUpdate } from "@/lib/supabase/database.types";

export type FinanceiroLancamento = Tables<"financeiro_lancamentos">;
export type FinanceiroLancamentoInsert = TablesInsert<"financeiro_lancamentos">;
export type FinanceiroLancamentoUpdate = TablesUpdate<"financeiro_lancamentos">;

export type FinanceiroTipo = FinanceiroLancamento["tipo"];
export type FinanceiroOrigem = FinanceiroLancamento["origem"];

export interface EventoFinanceiroSummary {
  entradaTotal: number;
  margemPercent: number | null;
  resultadoFesta: number;
  saidaTotal: number;
  upsellTotal: number;
}

export interface TenantFinanceiroPeriodSummary {
  entradas: number;
  resultado: number;
  saidas: number;
}
